import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  Trophy,
  ArrowLeft,
  Loader2,
  Users,
  Swords,
  Clock,
  QrCode,
  Play,
  Camera,
  CameraOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type TournamentState = 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
type MatchResult = 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'BYE' | null;
type ScannerMode = 'join_tournament' | 'add_player_by_qr';

type DetectedBarcodeLike = { rawValue?: string };
type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcodeLike[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game_type: 'MTG' | 'PKM' | 'YGO';
  format: 'SWISS' | 'SINGLE_ELIM';
  state: TournamentState;
  max_players: number;
  current_round: number;
  rounds: number;
  start_time: string | null;
  organizer_id: string;
}

interface ParticipantRow {
  id: string;
  user_id: string;
  current_points: number;
  has_bye: boolean;
  user: {
    id: string;
    username: string;
    elo_rating: number;
    qr_code: string | null;
  } | null;
}

interface MatchRow {
  id: string;
  round_number: number;
  table_number: number | null;
  player1_id: string;
  player2_id: string | null;
  result: MatchResult;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  player1_wins: number;
  player2_wins: number;
  draws: number;
  player1: { username: string; elo_rating: number } | null;
  player2: { username: string; elo_rating: number } | null;
}

const K_FACTOR = 24;

const expectedScore = (a: number, b: number) => 1 / (1 + 10 ** ((b - a) / 400));

const updateEloPair = (a: number, b: number, aScore: number, bScore: number) => {
  const ea = expectedScore(a, b);
  const eb = expectedScore(b, a);
  return {
    aNew: Math.round(a + K_FACTOR * (aScore - ea)),
    bNew: Math.round(b + K_FACTOR * (bScore - eb)),
  };
};

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const getErrorMessage = (e: unknown, fallback: string) => {
  if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
};

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinQrCode, setJoinQrCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>('join_tournament');
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerFrameRef = useRef<number | null>(null);
  const scannerDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scannerLockedRef = useRef(false);

  const isAdmin = !!profile && (profile.role === 'ADMIN' || profile.role === 'ORGANIZER');
  const isOwner = !!profile && tournament?.organizer_id === profile.id;
  const canManage = isAdmin || isOwner;
  const isJoined = !!user && participants.some((p) => p.user_id === user.id);

  const tournamentJoinCode = tournament ? `TOURNAMENT:${tournament.id}` : '';

  const standings = useMemo(
    () =>
      [...participants].sort((a, b) => {
        if (b.current_points !== a.current_points) return b.current_points - a.current_points;
        return (b.user?.elo_rating || 1200) - (a.user?.elo_rating || 1200);
      }),
    [participants]
  );

  const currentRoundMatches = useMemo(
    () => matches.filter((m) => m.round_number === (tournament?.current_round || 1)),
    [matches, tournament]
  );

  useEffect(() => {
    if (!id) return;
    void loadAll();

    const channel = supabase
      .channel(`tournament-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, () => {
        void loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `tournament_id=eq.${id}` }, () => {
        void loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` }, () => {
        void loadAll();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return;
    }
    void startScanner();
    return () => {
      stopScanner();
    };
  }, [scannerOpen]);

  const loadAll = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [{ data: t, error: tErr }, { data: p, error: pErr }, { data: m, error: mErr }] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase
          .from('participants')
          .select('id,user_id,current_points,has_bye,user:users(id,username,elo_rating,qr_code)')
          .eq('tournament_id', id),
        supabase
          .from('matches')
          .select(
            'id,round_number,table_number,player1_id,player2_id,result,status,player1_wins,player2_wins,draws,player1:users!player1_id(username,elo_rating),player2:users!player2_id(username,elo_rating)'
          )
          .eq('tournament_id', id)
          .order('round_number', { ascending: false })
          .order('table_number', { ascending: true }),
      ]);

      if (tErr) throw tErr;
      if (pErr) throw pErr;
      if (mErr) throw mErr;

      setTournament(t as Tournament);
      setParticipants((p || []) as ParticipantRow[]);
      setMatches((m || []) as MatchRow[]);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo cargar el torneo'));
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    if (scannerFrameRef.current !== null) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    if (scannerVideoRef.current) {
      scannerVideoRef.current.srcObject = null;
    }
    scannerDetectorRef.current = null;
    scannerLockedRef.current = false;
  };

  const processScannedCode = async (value: string) => {
    if (!tournament) return;
    const scanned = value.trim();
    if (!scanned) return;

    if (scannerMode === 'join_tournament') {
      if (!user) throw new Error('Debes iniciar sesión para inscribirte');
      if (scanned !== tournamentJoinCode && scanned !== tournament.id) {
        throw new Error('El QR no corresponde a este torneo');
      }
      await joinParticipantByUserId(user.id);
      return;
    }

    await joinParticipantByPlayerQr(scanned);
  };

  const scanLoop = async () => {
    if (!scannerOpen || scannerLockedRef.current) return;
    if (!scannerVideoRef.current || !scannerDetectorRef.current) return;

    try {
      const detections = await scannerDetectorRef.current.detect(scannerVideoRef.current);
      const found = detections.find((d) => d.rawValue && d.rawValue.trim().length > 0);
      if (found?.rawValue) {
        scannerLockedRef.current = true;
        try {
          await processScannedCode(found.rawValue);
          setScannerOpen(false);
          await loadAll();
        } catch (e: unknown) {
          setScannerError(getErrorMessage(e, 'No se pudo procesar el código QR'));
          scannerLockedRef.current = false;
        }
      }
    } catch {
      // Ignore transient detector errors frame-by-frame.
    }

    scannerFrameRef.current = requestAnimationFrame(() => {
      void scanLoop();
    });
  };

  const startScanner = async () => {
    setScannerError(null);
    if (!window.isSecureContext) {
      setScannerError('El escaneo QR requiere HTTPS o localhost.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Tu navegador no permite acceso a cámara.');
      return;
    }

    const BarcodeDetectorImpl = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!BarcodeDetectorImpl) {
      setScannerError('Tu navegador no soporta BarcodeDetector. Usa el ingreso manual de código.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      scannerStreamRef.current = stream;

      if (!scannerVideoRef.current) {
        setScannerError('No se pudo inicializar el visor de cámara.');
        return;
      }

      scannerVideoRef.current.srcObject = stream;
      await scannerVideoRef.current.play();
      scannerDetectorRef.current = new BarcodeDetectorImpl({ formats: ['qr_code'] });
      scannerFrameRef.current = requestAnimationFrame(() => {
        void scanLoop();
      });
    } catch (e: unknown) {
      setScannerError(getErrorMessage(e, 'No se pudo abrir la cámara para escaneo QR'));
      stopScanner();
    }
  };

  const openScanner = (mode: ScannerMode) => {
    setScannerMode(mode);
    setScannerError(null);
    setScannerOpen(true);
  };

  const joinParticipantByUserId = async (participantUserId: string) => {
    if (!tournament) throw new Error('Torneo no disponible');
    if (tournament.state !== 'OPEN') throw new Error('El torneo ya no acepta inscripciones');
    if (participants.length >= tournament.max_players) throw new Error('El torneo está completo');
    if (participants.some((p) => p.user_id === participantUserId)) throw new Error('El jugador ya está inscrito');

    const { error: insErr } = await supabase.from('participants').insert({
      user_id: participantUserId,
      tournament_id: tournament.id,
      seed: participants.length + 1,
    });
    if (insErr) {
      const code = (insErr as { code?: string }).code;
      if (code === '23505') throw new Error('El jugador ya está inscrito');
      throw insErr;
    }
  };

  const joinParticipantByPlayerQr = async (code: string) => {
    if (!canManage || !tournament) throw new Error('No autorizado');
    if (tournament.state !== 'OPEN') throw new Error('Solo se puede inscribir en estado abierto');

    const { data: u, error: uErr } = await supabase.from('users').select('id').eq('qr_code', code).maybeSingle();
    if (uErr) throw uErr;
    if (!u?.id) throw new Error('Código QR de jugador no encontrado');

    await joinParticipantByUserId(u.id);
  };

  const createDemoPlayers = async () => {
    if (!canManage) return;
    setIsSaving(true);
    setError(null);
    try {
      const demos = ['player1', 'player2', 'player3', 'player4'].map((u, i) => ({
        username: u,
        email: `${u}@local.arenadeck`,
        password_hash: 'demo123',
        role: 'PLAYER',
        elo_rating: 1200 + i * 30,
        qr_code: `QR-${u.toUpperCase()}`,
      }));
      const { error: upsertError } = await supabase.from('users').upsert(demos, { onConflict: 'email' });
      if (upsertError) throw upsertError;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudieron crear jugadores demo'));
    } finally {
      setIsSaving(false);
    }
  };

  const joinSelf = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await joinParticipantByUserId(user.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo unir'));
    } finally {
      setIsSaving(false);
    }
  };

  const joinByQr = async () => {
    if (!joinQrCode.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await joinParticipantByPlayerQr(joinQrCode.trim());
      setJoinQrCode('');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo unir por QR'));
    } finally {
      setIsSaving(false);
    }
  };

  const leaveSelf = async () => {
    if (!user || !tournament) return;
    setIsSaving(true);
    setError(null);
    try {
      if (tournament.state !== 'OPEN') throw new Error('No puedes salir cuando el torneo ya inició');
      const { error: delErr } = await supabase
        .from('participants')
        .delete()
        .match({ user_id: user.id, tournament_id: tournament.id });
      if (delErr) throw delErr;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo salir'));
    } finally {
      setIsSaving(false);
    }
  };

  const generateSwissRound = async () => {
    if (!tournament || !canManage) return;
    setIsSaving(true);
    setError(null);
    try {
      if (participants.length < 2) throw new Error('Se necesitan al menos 2 jugadores');

      const activeRound = tournament.current_round || 0;
      if (activeRound > 0) {
        const allDone = currentRoundMatches.every((m) => m.status === 'COMPLETED');
        if (!allDone) throw new Error('Completa todos los matches de la ronda actual antes de avanzar');
      }

      const nextRound = activeRound + 1;
      const sorted = [...standings];
      const played = new Set(
        matches
          .filter((m) => m.player2_id)
          .map((m) => pairKey(m.player1_id, m.player2_id as string))
      );

      const roundPlayers = [...sorted];
      const createdMatches: Array<Record<string, unknown>> = [];

      if (roundPlayers.length % 2 !== 0) {
        let byeIndex = roundPlayers.length - 1;
        const noByeIndex = roundPlayers.findIndex((p) => !p.has_bye);
        if (noByeIndex >= 0) byeIndex = noByeIndex;
        const byePlayer = roundPlayers.splice(byeIndex, 1)[0];

        createdMatches.push({
          tournament_id: tournament.id,
          round_number: nextRound,
          table_number: 999,
          player1_id: byePlayer.user_id,
          player2_id: null,
          result: 'BYE',
          status: 'COMPLETED',
          player1_wins: 2,
          player2_wins: 0,
          draws: 0,
        });

        const { error: byeErr } = await supabase
          .from('participants')
          .update({
            current_points: byePlayer.current_points + 3,
            has_bye: true,
          })
          .eq('id', byePlayer.id);
        if (byeErr) throw byeErr;
      }

      let table = 1;
      while (roundPlayers.length > 1) {
        const p1 = roundPlayers.shift() as ParticipantRow;
        let idx = roundPlayers.findIndex((p2) => !played.has(pairKey(p1.user_id, p2.user_id)));
        if (idx < 0) idx = 0;
        const p2 = roundPlayers.splice(idx, 1)[0];

        createdMatches.push({
          tournament_id: tournament.id,
          round_number: nextRound,
          table_number: table,
          player1_id: p1.user_id,
          player2_id: p2.user_id,
          status: 'PENDING',
          result: null,
          player1_wins: 0,
          player2_wins: 0,
          draws: 0,
        });
        table += 1;
      }

      const { error: insErr } = await supabase.from('matches').insert(createdMatches);
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from('tournaments')
        .update({
          state: 'IN_PROGRESS',
          current_round: nextRound,
          rounds: Math.max(tournament.rounds || 0, Math.ceil(Math.log2(participants.length))),
        })
        .eq('id', tournament.id);
      if (updErr) throw updErr;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo generar la ronda'));
    } finally {
      setIsSaving(false);
    }
  };

  const reportResult = async (match: MatchRow, result: 'P1_WIN' | 'P2_WIN' | 'DRAW') => {
    if (!tournament || !canManage) return;
    setIsSaving(true);
    setError(null);
    try {
      const p1 = participants.find((p) => p.user_id === match.player1_id);
      const p2 = participants.find((p) => p.user_id === match.player2_id);
      if (!p1 || !p2) throw new Error('Participantes no encontrados');

      const rpcAttempt = await supabase.rpc('report_match_result_tx', {
        p_match_id: match.id,
        p_result: result,
        p_actor_id: profile?.id || null,
      });

      if (!rpcAttempt.error) return;

      const fnMissing = (rpcAttempt.error as { code?: string }).code === '42883';
      if (!fnMissing) {
        throw rpcAttempt.error;
      }

      // Fallback path if RPC was not created yet.
      let p1Points = p1.current_points;
      let p2Points = p2.current_points;
      let p1Score = 0.5;
      let p2Score = 0.5;
      let p1Wins = 1;
      let p2Wins = 1;
      let draws = 1;

      if (result === 'P1_WIN') {
        p1Points += 3;
        p1Score = 1;
        p2Score = 0;
        p1Wins = 2;
        p2Wins = 0;
        draws = 0;
      } else if (result === 'P2_WIN') {
        p2Points += 3;
        p1Score = 0;
        p2Score = 1;
        p1Wins = 0;
        p2Wins = 2;
        draws = 0;
      } else {
        p1Points += 1;
        p2Points += 1;
      }

      const p1Elo = p1.user?.elo_rating || 1200;
      const p2Elo = p2.user?.elo_rating || 1200;
      const { aNew, bNew } = updateEloPair(p1Elo, p2Elo, p1Score, p2Score);

      const { error: matchErr } = await supabase
        .from('matches')
        .update({
          result,
          status: 'COMPLETED',
          player1_wins: p1Wins,
          player2_wins: p2Wins,
          draws,
        })
        .eq('id', match.id);
      if (matchErr) throw matchErr;

      const { error: p1Err } = await supabase.from('participants').update({ current_points: p1Points }).eq('id', p1.id);
      if (p1Err) throw p1Err;
      const { error: p2Err } = await supabase.from('participants').update({ current_points: p2Points }).eq('id', p2.id);
      if (p2Err) throw p2Err;

      const { error: u1Err } = await supabase.from('users').update({ elo_rating: aNew }).eq('id', p1.user_id);
      if (u1Err) throw u1Err;
      const { error: u2Err } = await supabase.from('users').update({ elo_rating: bNew }).eq('id', p2.user_id);
      if (u2Err) throw u2Err;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo guardar resultado'));
    } finally {
      setIsSaving(false);
    }
  };

  const finishTournament = async () => {
    if (!tournament || !canManage) return;
    setIsSaving(true);
    setError(null);
    try {
      const pending = matches.some((m) => m.status !== 'COMPLETED');
      if (pending) throw new Error('Aún hay partidas pendientes');
      const { error: updErr } = await supabase
        .from('tournaments')
        .update({ state: 'FINISHED', end_time: new Date().toISOString() })
        .eq('id', tournament.id);
      if (updErr) throw updErr;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'No se pudo finalizar'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-arcane-400 animate-spin" />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-7xl mx-auto text-center py-32">
          <p className="text-rose-400 text-xl">{error}</p>
          <Link to="/tournaments" className="btn-primary inline-block mt-4">
            Volver a torneos
          </Link>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          Volver a torneos
        </Link>

        {error && <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-3 rounded-lg">{error}</div>}

        <div className="glass-panel p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              <p className="text-slate-400 mt-1">{tournament.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Estado</div>
              <div className="text-white font-bold">{tournament.state}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Swords className="w-4 h-4" />
                <span className="text-sm">Juego</span>
              </div>
              <p className="text-white font-bold">{tournament.game_type}</p>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">Formato</span>
              </div>
              <p className="text-white font-bold">{tournament.format}</p>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Jugadores</span>
              </div>
              <p className="text-white font-bold">
                {participants.length}/{tournament.max_players}
              </p>
            </div>
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Ronda</span>
              </div>
              <p className="text-white font-bold">{tournament.current_round || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4">Inscripción</h2>
            <div className="flex flex-wrap gap-3">
              {isJoined ? (
                <button type="button" className="btn-secondary" disabled={isSaving || tournament.state !== 'OPEN'} onClick={() => void leaveSelf()}>
                  Salir del torneo
                </button>
              ) : (
                <button type="button" className="btn-primary" disabled={isSaving || tournament.state !== 'OPEN'} onClick={() => void joinSelf()}>
                  Unirme al torneo
                </button>
              )}

              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                disabled={isSaving || tournament.state !== 'OPEN'}
                onClick={() => openScanner('join_tournament')}
              >
                <Camera className="w-4 h-4" />
                Escanear QR del torneo
              </button>

              {canManage && (
                <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => void createDemoPlayers()}>
                  Crear usuarios demo
                </button>
              )}
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4 items-start">
              <div>
                <p className="text-sm text-slate-300 mb-2">QR de inscripción del torneo</p>
                <img
                  src={`https://quickchart.io/qr?size=190&text=${encodeURIComponent(tournamentJoinCode)}`}
                  alt="QR de inscripción del torneo"
                  className="rounded-lg border border-slate-700 bg-white p-2"
                />
                <p className="text-xs text-slate-500 mt-2 break-all">{tournamentJoinCode}</p>
              </div>

              {canManage && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Agregar jugador por QR (manual)</label>
                  <div className="flex gap-2">
                    <input
                      value={joinQrCode}
                      onChange={(e) => setJoinQrCode(e.target.value)}
                      className="input-field"
                      placeholder="Ej: QR-PLAYER1"
                    />
                    <button type="button" className="btn-primary flex items-center gap-2" onClick={() => void joinByQr()} disabled={isSaving}>
                      <QrCode className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mt-3 flex items-center gap-2"
                    onClick={() => openScanner('add_player_by_qr')}
                    disabled={isSaving}
                  >
                    <Camera className="w-4 h-4" />
                    Escanear QR de jugador
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4">Control de Torneo</h2>
            {canManage ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-primary flex items-center gap-2" disabled={isSaving} onClick={() => void generateSwissRound()}>
                  <Play className="w-4 h-4" />
                  {tournament.current_round ? 'Siguiente ronda' : 'Iniciar torneo'}
                </button>
                <button type="button" className="btn-secondary" disabled={isSaving || tournament.state === 'FINISHED'} onClick={() => void finishTournament()}>
                  Finalizar torneo
                </button>
              </div>
            ) : (
              <p className="text-slate-400">Solo administrador/organizador puede iniciar rondas o cerrar torneo.</p>
            )}
          </div>
        </div>

        {scannerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="glass-panel w-full max-w-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Escáner QR</h3>
                <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setScannerOpen(false)}>
                  <CameraOff className="w-4 h-4" />
                  Cerrar
                </button>
              </div>
              <video ref={scannerVideoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black aspect-video object-cover" />
              <p className="text-sm text-slate-400 mt-3">
                {scannerMode === 'join_tournament'
                  ? 'Apunta la cámara al QR del torneo para inscribirte automáticamente.'
                  : 'Apunta la cámara al QR del jugador para agregarlo al torneo.'}
              </p>
              {scannerError && <p className="text-sm text-rose-300 mt-2">{scannerError}</p>}
            </div>
          </div>
        )}

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tabla en Tiempo Real</h2>
          {standings.length === 0 ? (
            <p className="text-slate-400">No hay jugadores inscritos.</p>
          ) : (
            <div className="space-y-2">
              {standings.map((p, idx) => (
                <div key={p.id} className="glass-panel p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      #{idx + 1} {p.user?.username || 'Jugador'}
                    </p>
                    <p className="text-xs text-slate-500">QR: {p.user?.qr_code || 'sin código'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-arcane-300 font-bold">{p.current_points} pts</p>
                    <p className="text-slate-400 text-sm">ELO {p.user?.elo_rating || 1200}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Partidas (Ronda Actual)</h2>
          {currentRoundMatches.length === 0 ? (
            <p className="text-slate-400">Aún no hay partidas creadas para esta ronda.</p>
          ) : (
            <div className="space-y-3">
              {currentRoundMatches.map((m) => (
                <div key={m.id} className="glass-panel p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">
                        Mesa {m.table_number ?? '-'}: {m.player1?.username || 'Jugador 1'} vs {m.player2?.username || 'BYE'}
                      </p>
                      <p className="text-sm text-slate-400">
                        Estado: {m.status} | Resultado: {m.result || 'pendiente'}
                      </p>
                    </div>
                    {canManage && m.player2_id && (
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => void reportResult(m, 'P1_WIN')}>
                          Gana P1
                        </button>
                        <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => void reportResult(m, 'DRAW')}>
                          Empate
                        </button>
                        <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => void reportResult(m, 'P2_WIN')}>
                          Gana P2
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
