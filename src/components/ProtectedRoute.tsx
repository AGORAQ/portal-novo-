import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/domain';

export function ProtectedRoute({
  children,
  allow
}: {
  children: React.ReactNode;
  allow?: UserRole[];
}) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="page"><div className="card">Carregando...</div></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="page"><div className="card">Perfil não encontrado.</div></div>;
  if (allow && !allow.includes(profile.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
