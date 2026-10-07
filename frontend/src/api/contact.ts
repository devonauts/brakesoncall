import client from './client';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string; // honeypot, must stay empty
  turnstile_token?: string;
}

export const contactApi = {
  submit: (data: ContactPayload) =>
    client.post<{ ok: boolean; id?: number }>('/contact', data).then((r) => r.data),
};
