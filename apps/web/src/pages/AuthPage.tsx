import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Swords, Mail, Lock, User, AlertCircle } from 'lucide-react';

type AppRole = 'PLAYER' | 'ORGANIZER' | 'ADMIN';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<AppRole>('PLAYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const getFriendlyError = (err: unknown) => {
    if (!(err instanceof Error)) return 'No se pudo completar la autenticación';
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('credenciales')) {
      return 'Usuario o contraseña incorrectos';
    }
    if (msg.includes('rate limit')) {
      return 'Demasiados intentos. Espera unos segundos e inténtalo de nuevo.';
    }
    if (msg.includes('user already registered')) {
      return 'Este correo ya está registrado';
    }
    return err.message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username, role);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdminDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn('admin', 'admin123');
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="arena-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/65 to-black/80" />
      
      <div className="relative w-full max-w-md">
        <div className="glass-panel p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-arcane-600 to-cyber-500 flex items-center justify-center shadow-glow-violet-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Únete a ArenaDeck'}
          </h1>
          <p className="text-slate-400 text-center mb-8">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para comenzar'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Tu nombre de jugador"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de cuenta
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="input-field"
                  >
                    <option value="PLAYER">Jugador</option>
                    <option value="ORGANIZER">Organizador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email o usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="tu@email.com o aredeck"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
            {isLogin && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void loginAsAdminDemo()}
                className="btn-secondary w-full py-3"
              >
                Entrar como Admin Demo
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-arcane-400 hover:text-arcane-300 text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-slate-500 text-sm">
          <span className="flex items-center gap-1">
            <Swords className="w-4 h-4" /> MTG
          </span>
          <span className="flex items-center gap-1">
            <Swords className="w-4 h-4" /> Pokémon
          </span>
          <span className="flex items-center gap-1">
            <Swords className="w-4 h-4" /> Yu-Gi-Oh!
          </span>
        </div>
      </div>
    </div>
  );
}
