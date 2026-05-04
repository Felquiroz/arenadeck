import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Swords, 
  Users, 
  Calendar, 
  Trophy,
  TrendingUp,
  Clock,
  Plus,
  Loader2
} from 'lucide-react';
import { TournamentCard } from '../components/TournamentCard';
import { tournamentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  game_type: 'MTG' | 'PKM' | 'YGO';
  format: 'SWISS' | 'SINGLE_ELIM';
  state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  max_players: number;
  current_round: number;
  created_at: string;
}

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadTournaments();

    const channel = tournamentService.subscribeToTournamentChanges(() => {
      void loadTournaments();
    });

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tournamentService.getAll();
      setTournaments(data || []);
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('No se pudieron cargar los torneos');
    } finally {
      setLoading(false);
    }
  };

  const formatTournamentForCard = (t: Tournament) => ({
    id: t.id,
    name: t.name,
    gameType: t.game_type,
    format: t.format,
    state: t.state,
    playerCount: 0,
    maxPlayers: t.max_players,
    currentRound: t.current_round,
    startTime: t.created_at,
  });

  const stats = {
    todayMatches: 0,
    activeTournaments: tournaments.filter((t) => t.state === 'IN_PROGRESS').length,
    totalPlayers: tournaments.length,
    finishedTournaments: tournaments.filter((t) => t.state === 'FINISHED').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            {user ? `Bienvenido, ${user.email}` : 'Bienvenido a ArenaDeck'}
          </p>
        </div>
{user && profile && ['ADMIN', 'ORGANIZER'].includes(profile.role) && (
  <Link to="/tournaments/create" className="btn-primary flex items-center gap-2">
    <Plus className="w-5 h-5" />
    <span className="hidden sm:inline">Nuevo Torneo</span>
  </Link>
)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Swords className="w-8 h-8 text-arcane-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.todayMatches}</p>
          <p className="text-sm text-slate-400">Partidas Hoy</p>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeTournaments}</p>
          <p className="text-sm text-slate-400">Torneos Activos</p>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-cyber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalPlayers}</p>
          <p className="text-sm text-slate-400">Total Torneos</p>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.finishedTournaments}</p>
          <p className="text-sm text-slate-400">Torneos Finalizados</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-arcane-400" />
            Torneos Recientes
          </h2>
          <Link to="/tournaments" className="text-arcane-400 hover:text-arcane-300 text-sm">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-arcane-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-rose-400">{error}</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No hay torneos aún</p>
            {user && profile && ['ADMIN', 'ORGANIZER'].includes(profile.role) && (
              <Link to="/tournaments/create" className="btn-primary">
                Crear Primer Torneo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.slice(0, 6).map((tournament) => (
              <TournamentCard
                key={tournament.id}
                {...formatTournamentForCard(tournament)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-arcane-400" />
            Actividad Reciente
          </h2>
          <div className="h-32 flex items-end gap-1">
            {[65, 45, 80, 55, 90, 70, 85, 95, 60, 75, 88, 92].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-arcane-600 to-arcane-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-arcane-400" />
            Próx. Torneos
          </h2>
          <div className="space-y-3">
            {tournaments
              .filter(t => t.state === 'OPEN')
              .slice(0, 3)
              .map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-arcane-600/20 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-arcane-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{tournament.name}</p>
                      <p className="text-xs text-slate-500">{tournament.game_type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-arcane-400">{tournament.format}</span>
                </div>
              ))}
            {tournaments.filter(t => t.state === 'OPEN').length === 0 && (
              <p className="text-slate-500 text-center py-4">No hay torneos próximos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
