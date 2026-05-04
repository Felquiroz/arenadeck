import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import TournamentList from './pages/TournamentList';
import TournamentCreate from './pages/TournamentCreate';
import TournamentDetails from './pages/TournamentDetails';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import Store from './pages/Store';
import PageLoader from './components/PageLoader';

function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Validando sesión..." />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout />;
}

function AuthOnly() {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Preparando acceso..." />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthOnly />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tournaments" element={<TournamentList />} />
          <Route path="tournaments/create" element={<TournamentCreate />} />
          <Route path="tournaments/:id" element={<TournamentDetails />} />
          <Route path="matches" element={<Matches />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="store" element={<Store />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
