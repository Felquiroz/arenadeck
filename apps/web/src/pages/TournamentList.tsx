import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  Swords, 
  Users, 
  Clock, 
  Zap,
  Plus,
  Loader2,
  Crown,
  Calendar,
  Play
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game_type: 'MTG' | 'PKM' | 'YGO';
  format: 'SWISS' | 'SINGLE_ELIM';
  state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  max_players: number;
  current_round: number;
  start_time: string | null;
  organizer_id: string;
  created_at: string;
}

const gameColors: Record<string, string> = {
  MTG: 'from-red-600 to-orange-500',
  PKM: 'from-yellow-500 to-red-500',
  YGO: 'from-purple-600 to-blue-600',
};

const gameIcons: Record<string, typeof Swords> = {
  MTG: Swords,
  PKM: Zap,
  YGO: Crown,
};

const stateConfig: Record<string, { label: string; class: string }> = {
  OPEN: { label: 'Abierto', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  IN_PROGRESS: { label: 'En Progreso', class: 'bg-arcane-500/20 text-arcane-400 border-arcane-500/30' },
  FINISHED: { label: 'Finalizado', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  CANCELLED: { label: 'Cancelado', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
};

export const TournamentList = () => {
  const { profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreateTournament = profile ? ['ADMIN', 'ORGANIZER'].includes(profile.role) : false;

  useEffect(() => {
    loadTournaments();

    const channel = supabase
      .channel('tournaments-list-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        void loadTournaments();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTournaments(data || []);
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-arcane-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400 animate-pulse">Conectando al servidor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="text-center glass-panel p-8">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Error de Conexión</h2>
              <p className="text-slate-400 mb-4">{error}</p>
              <button onClick={loadTournaments} className="btn-primary">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
                ARENADECK
              </span>
            </h1>
            <p className="text-slate-400 mt-1">Gestión profesional de torneos TCG</p>
          </div>
          {canCreateTournament && (
            <Link to="/tournaments/create" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear Torneo
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-arcane-400" />
              <span className="text-slate-400 text-sm">Total Torneos</span>
            </div>
            <p className="text-2xl font-bold text-white">{tournaments.length}</p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <Play className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Activos</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {tournaments.filter(t => t.state === 'IN_PROGRESS').length}
            </p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span className="text-slate-400 text-sm">Abiertos</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {tournaments.filter(t => t.state === 'OPEN').length}
            </p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-cyber-400" />
              <span className="text-slate-400 text-sm">Finalizados</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {tournaments.filter(t => t.state === 'FINISHED').length}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-arcane-400" />
            Torneos Disponibles
          </h2>

          {tournaments.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-arcane-600/20 to-cyber-500/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-arcane-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No hay torneos activos
              </h3>
              <p className="text-slate-400 mb-6">
                ¡Crea el primer torneo de la plataforma!
              </p>
              {canCreateTournament && (
                <Link to="/tournaments/create" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear Primer Torneo
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => {
                const GameIcon = gameIcons[tournament.game_type] || Swords;
                const state = stateConfig[tournament.state];
                
                return (
                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    className="group relative block overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:scale-105 transition-all duration-300 hover:border-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-arcane-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gameColors[tournament.game_type]} flex items-center justify-center shadow-lg`}>
                          <GameIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${state.class}`}>
                          {state.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                        {tournament.name}
                      </h3>

                      {tournament.description && (
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {tournament.max_players} max
                        </span>
                        <span className="flex items-center gap-1">
                          <Swords className="w-4 h-4" />
                          {tournament.format}
                        </span>
                        {tournament.current_round > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            R{tournament.current_round}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                          {tournament.game_type}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                          <Play className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentList;
