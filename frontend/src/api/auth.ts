import client from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => client.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  refresh: () =>
    client.post<{ access_token: string }>('/auth/refresh').then((r) => r.data),

  getMe: () => client.get<User>('/auth/me').then((r) => r.data),

  updateMe: (data: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'avatar_url'>>) =>
    client.put<User>('/auth/me', data).then((r) => r.data),
};
