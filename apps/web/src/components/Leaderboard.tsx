import { Crown, TrendingUp, TrendingDown, Minus, User, Zap } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user: { id: string; username: string; eloRating: number };
  tournamentPoints?: number;
  omw?: number;
  gw?: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  showTournamentStats?: boolean;
}

export const Leaderboard = ({ entries, showTournamentStats }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Crown className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Crown className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-slate-500 font-mono">#{rank}</span>;
    }
  };

  return (
    <div className="glass-panel overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
        <Crown className="w-5 h-5 text-arcane-400" />
        <h2 className="text-lg font-bold text-white">Clasificación</h2>
      </div>

      <div className="divide-y divide-slate-700/30">
        {entries.map((entry) => (
          <div
            key={entry.user.id}
            className={`flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors ${
              entry.rank <= 3 ? 'bg-gradient-to-r from-arcane-900/20 to-transparent' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arcane-600 to-cyber-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{entry.user.username}</p>
                <p className="text-xs text-slate-500">ID: {entry.user.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {showTournamentStats ? (
                <>
                  <div className="text-center">
                    <p className="points-pill">{entry.tournamentPoints} pts</p>
                  </div>
                  <div className="text-center text-xs">
                    <p className="text-slate-500">OMW</p>
                    <p className="text-white font-semibold">{entry.omw?.toFixed(1)}%</p>
                  </div>
                  <div className="text-center text-xs">
                    <p className="text-slate-500">GW</p>
                    <p className="text-white font-semibold">{entry.gw?.toFixed(1)}%</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-arcane-600 to-arcane-700">
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span className="font-bold text-white">{entry.user.eloRating}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="p-8 text-center">
          <Crown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay participantes</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;