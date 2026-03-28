import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Also check localStorage directly in case zustand hasn't hydrated yet
  const hasStoredAuth = () => {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (!stored) return false;
      const { state } = JSON.parse(stored);
      return !!state?.token && !!state?.isAuthenticated;
    } catch {
      return false;
    }
  };

  if (!isAuthenticated && !hasStoredAuth()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
