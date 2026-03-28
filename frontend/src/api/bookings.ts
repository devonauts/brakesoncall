import client from './client';
import type { Booking, BookingCreateData, PaginatedResponse } from '../types';

export const bookingsApi = {
  list: (params?: { page?: number; per_page?: number; status?: string }) =>
    client.get<PaginatedResponse<Booking>>('/bookings', { params }).then((r) => r.data),

  get: (id: number) =>
    client.get<Booking>(`/bookings/${id}`).then((r) => r.data),

  create: (data: BookingCreateData) =>
    client.post<Booking>('/bookings', data).then((r) => r.data),

  update: (id: number, data: Partial<Booking>) =>
    client.put<Booking>(`/bookings/${id}`, data).then((r) => r.data),

  assign: (id: number, technician_id: number) =>
    client.put<Booking>(`/bookings/${id}/assign`, { technician_id }).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    client.put<Booking>(`/bookings/${id}/status`, { status }).then((r) => r.data),
};
