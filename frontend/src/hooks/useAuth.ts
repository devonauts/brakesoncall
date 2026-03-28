import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';

export function useAuth(options?: { skipRedirect?: boolean }) {
  const store = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      store.login(data.user, data.access_token, data.refresh_token);

      if (!options?.skipRedirect) {
        if (data.user.role === 'customer') {
          navigate('/account/dashboard');
        } else {
          navigate('/backoffice/dashboard');
        }
      }
    },
    [store, navigate, options?.skipRedirect]
  );

  const register = useCallback(
    async (formData: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone?: string;
    }) => {
      const data = await authApi.register(formData);
      store.login(data.user, data.access_token, data.refresh_token);

      if (!options?.skipRedirect) {
        navigate('/account/dashboard');
      }
    },
    [store, navigate, options?.skipRedirect]
  );

  const logout = useCallback(() => {
    store.logout();
    navigate('/');
  }, [store, navigate]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    hasRole: store.hasRole,
    login,
    register,
    logout,
  };
}
