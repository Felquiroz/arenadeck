import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trophy, Loader2, Crown } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('elo_rating', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setPlayers(data || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Error al cargar la tabla de posiciones');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-arcane-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-arcane-400" />
          Tabla de Posiciones
        </h1>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {players.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay jugadores registrados</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-medium">#</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Jugador</th>
                  <th className="text-center p-4 text-slate-400 font-medium">ELO</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Victorias</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Derrotas</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Empates</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-4 text-slate-400">{index + 1}</td>
                    <td className="p-4 text-white font-medium">{player.username}</td>
                    <td className="p-4 text-center text-arcane-400 font-bold">{player.elo_rating}</td>
                    <td className="p-4 text-center text-emerald-400">{player.wins}</td>
                    <td className="p-4 text-center text-rose-400">{player.losses}</td>
                    <td className="p-4 text-center text-slate-400">{player.draws}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
