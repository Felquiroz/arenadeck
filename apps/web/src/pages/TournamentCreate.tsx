import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const gameTypes = [
  { value: 'MTG', label: 'Magic: The Gathering' },
  { value: 'PKM', label: 'Pokémon TCG' },
  { value: 'YGO', label: 'Yu-Gi-Oh!' }
];

const formats = [
  { value: 'SWISS', label: 'Suizo' },
  { value: 'SINGLE_ELIM', label: 'Eliminación Simple' }
];

export const TournamentCreate = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_type: 'MTG' as const,
    format: 'SWISS' as const,
    max_players: 16,
    start_time: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_players' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!profile) {
        throw new Error('Debes iniciar sesión para crear torneos');
      }

      if (!['ADMIN', 'ORGANIZER'].includes(profile.role)) {
        throw new Error('Solo organizadores o administradores pueden crear torneos');
      }

      if (formData.name.trim().length < 3) {
        throw new Error('El nombre del torneo debe tener al menos 3 caracteres');
      }
      if (Number(formData.max_players) < 2 || Number(formData.max_players) > 512) {
        throw new Error('El máximo de jugadores debe estar entre 2 y 512');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        game_type: formData.game_type,
        format: formData.format,
        max_players: Number(formData.max_players),
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        organizer_id: profile.id,
      };

      const { error: supabaseError } = await supabase
        .from('tournaments')
        .insert([payload]);

      if (supabaseError) throw supabaseError;
      navigate('/tournaments');
    } catch (err: unknown) {
      console.error('Error creating tournament:', err);
      const message =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : err instanceof Error
            ? err.message
            : 'Error al crear el torneo';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile || !['ADMIN', 'ORGANIZER'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Acceso restringido</h1>
            <p className="text-slate-400 mb-6">
              Solo cuentas con rol de organizador o administrador pueden crear torneos.
            </p>
            <Link to="/tournaments" className="btn-primary inline-flex">
              Volver a torneos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          Volver a torneos
        </Link>

        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-arcane-400" />
            Crear Nuevo Torneo
          </h1>

          {error && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Torneo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="Ej: Torneo Regional MTG"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="Detalles del torneo..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Juego</label>
                <select
                  name="game_type"
                  value={formData.game_type}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                >
                  {gameTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Formato</label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                >
                  {formats.map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Máximo de Jugadores</label>
                <input
                  type="number"
                  name="max_players"
                  value={formData.max_players}
                  onChange={handleChange}
                  min={2}
                  max={512}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de Inicio</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  Crear Torneo
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentCreate;
