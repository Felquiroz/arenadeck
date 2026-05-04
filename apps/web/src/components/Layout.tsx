import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Crown,
  Settings,
  Menu,
  X,
  Swords,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Trophy },
  { path: '/tournaments', label: 'Torneos', icon: Calendar },
  { path: '/matches', label: 'Partidas', icon: Swords },
  { path: '/leaderboard', label: 'Ranking', icon: Crown },
  { path: '/store', label: 'Tienda', icon: Users },
];

export const Layout = () => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex">
      <div className="arena-overlay" />
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 bg-slate-900/80 backdrop-blur-lg border-r border-slate-800/50">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arcane-600 to-cyber-500 flex items-center justify-center shadow-glow-violet">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">ARENA</h1>
            <p className="text-xs text-arcane-400 font-medium">DECK</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-arcane-500/20 text-arcane-400 border-l-2 border-arcane-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <div className="px-4 py-2 text-xs text-slate-500">
            {profile?.username || 'Usuario'} ({profile?.role || 'PLAYER'})
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800/50 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arcane-600 to-cyber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">ArenaDeck</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[57px] z-40 bg-slate-950/95 backdrop-blur-lg">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-arcane-500/20 text-arcane-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
