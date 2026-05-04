import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Swords, Zap, Crown } from 'lucide-react';

interface TournamentCardProps {
  id: string;
  name: string;
  gameType: 'MTG' | 'PKM' | 'YGO';
  format: 'SWISS' | 'SINGLE_ELIM';
  state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED';
  playerCount: number;
  maxPlayers: number;
  currentRound?: number;
  startTime?: string;
}

const gameIcons: Record<string, ReactNode> = {
  MTG: <Swords className="w-5 h-5" />,
  PKM: <Zap className="w-5 h-5" />,
  YGO: <Crown className="w-5 h-5" />,
};

const gameColors: Record<string, string> = {
  MTG: 'from-red-600 to-orange-500',
  PKM: 'from-yellow-500 to-red-500',
  YGO: 'from-purple-600 to-blue-600',
};

const stateColors: Record<string, string> = {
  OPEN: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  IN_PROGRESS: 'text-arcane-400 bg-arcane-500/20 border-arcane-500/30',
  FINISHED: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
};

export const TournamentCard = ({
  id,
  name,
  gameType,
  format,
  state,
  playerCount,
  maxPlayers,
  currentRound,
  startTime,
}: TournamentCardProps) => {
  const stateLabels: Record<string, string> = {
    OPEN: 'Abierto',
    IN_PROGRESS: 'En Progreso',
    FINISHED: 'Finalizado',
  };

  return (
    <Link to={`/tournaments/${id}`}>
      <div className="group relative overflow-hidden rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-arcane-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-violet cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-arcane-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gameColors[gameType]} flex items-center justify-center shadow-lg`}>
              <div className="text-white">{gameIcons[gameType]}</div>
            </div>
            <span className={`badge border ${stateColors[state]}`}>
              {stateLabels[state]}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-arcane-400 transition-colors">
            {name}
          </h3>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{playerCount}/{maxPlayers}</span>
            </div>
            {currentRound && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Ronda {currentRound}</span>
              </div>
            )}
            <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">
              {format}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {gameType}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-arcane-600 transition-colors">
              <Swords className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;