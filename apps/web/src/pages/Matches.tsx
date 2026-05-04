import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trophy, Loader2, Swords } from 'lucide-react';

interface Match {
  id: string;
  tournament_id: string;
  round: number;
  player1_id: string | null;
  player2_id: string | null;
  result: string | null;
  state: string;
}

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('round', { ascending: true });

      if (fetchError) throw fetchError;
      setMatches(data || []);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Error al cargar los partidos');
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
          <Swords className="w-8 h-8 text-arcane-400" />
          Partidos
        </h1>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Swords className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay partidos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.id} className="glass-panel p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Ronda {match.round}</p>
                    <p className="text-slate-400 text-sm">Partido {match.id.slice(0, 8)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    match.state === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    match.state === 'IN_PROGRESS' ? 'bg-arcane-500/20 text-arcane-400 border-arcane-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>
                    {match.state === 'COMPLETED' ? 'Completado' :
                     match.state === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
