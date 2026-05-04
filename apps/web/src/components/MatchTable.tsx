import { Trophy, User, Clock, Swords } from 'lucide-react';

interface Match {
  id: string;
  tableNumber: number;
  roundNumber: number;
  player1: { id: string; username: string; eloRating: number } | null;
  player2: { id: string; username: string; eloRating: number } | null;
  result?: 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'BYE' | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface MatchTableProps {
  matches: Match[];
  currentRound: number;
  onReportResult?: (matchId: string) => void;
}

export const MatchTable = ({ matches, currentRound, onReportResult }: MatchTableProps) => {
  const filteredMatches = matches.filter(m => m.roundNumber === currentRound);
  const pendingMatches = filteredMatches.filter(m => m.status === 'PENDING');
  const completedMatches = filteredMatches.filter(m => m.status === 'COMPLETED');

  const getResultBadge = (result: Match['result']) => {
    if (!result) return null;
    switch (result) {
      case 'P1_WIN':
        return <span className="badge-win">Gana P1</span>;
      case 'P2_WIN':
        return <span className="badge-lose">Gana P2</span>;
      case 'DRAW':
        return <span className="badge-draw">Empate</span>;
      case 'BYE':
        return <span className="badge bg-slate-500/20 text-slate-400">BYE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-arcane-400" />
          Ronda {currentRound}
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            <span className="text-amber-400 font-semibold">{pendingMatches.length}</span>Pending
          </span>
          <span className="text-slate-400">
            <span className="text-emerald-400 font-semibold">{completedMatches.length}</span>Completed
          </span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mesa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Jugador 1
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Resultado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Jugador 2
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredMatches.map((match) => (
              <tr
                key={match.id}
                className={`hover:bg-slate-800/30 transition-colors ${
                  match.status === 'IN_PROGRESS' ? 'bg-arcane-500/10' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-400 font-mono text-sm">
                    {match.tableNumber}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arcane-600 to-cyber-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {match.player1?.username || 'TBD'}
                      </p>
                      {match.player1?.eloRating && (
                        <p className="text-xs text-slate-500">
                          ELO: {match.player1.eloRating}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-center">{getResultBadge(match.result)}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {match.player2?.username || 'TBD'}
                      </p>
                      {match.player2?.eloRating && (
                        <p className="text-xs text-slate-500">
                          ELO: {match.player2.eloRating}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {match.status === 'PENDING' && onReportResult ? (
                    <button
                      onClick={() => onReportResult(match.id)}
                      className="btn-cyber text-sm py-2"
                    >
                      Reportar
                    </button>
                  ) : match.status === 'IN_PROGRESS' ? (
                    <span className="inline-flex items-center gap-1.5 text-cyber-400 text-sm">
                      <Clock className="w-4 h-4 animate-pulse" />
                      En curso
                    </span>
                  ) : (
                    <Swords className="w-5 h-5 text-slate-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMatches.length === 0 && (
          <div className="p-8 text-center">
            <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay partidas en esta ronda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchTable;