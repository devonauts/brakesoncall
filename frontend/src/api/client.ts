import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Response interceptor - handle 401 and refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
              headers: { Authorization: `Bearer ${state.refreshToken}` },
            });

            const newToken = res.data.access_token;

            // Update stored token
            const parsed = JSON.parse(stored);
            parsed.state.token = newToken;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch {
          // Refresh failed - just reject, don't hard redirect
          console.warn('Token refresh failed');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default client;
