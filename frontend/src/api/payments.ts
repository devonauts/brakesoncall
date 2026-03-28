import client from './client';
import type { Payment, PaginatedResponse, PaymentMethod } from '../types';

export const paymentsApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    client.get<PaginatedResponse<Payment>>('/payments', { params }).then((r) => r.data),

  get: (id: number) => client.get<Payment>(`/payments/${id}`).then((r) => r.data),

  create: (data: { booking_id: number; amount: number; payment_method: PaymentMethod; transaction_id?: string }) =>
    client.post<Payment>('/payments', data).then((r) => r.data),

  refund: (id: number) =>
    client.put<Payment>(`/payments/${id}/refund`).then((r) => r.data),
};
