import client from './client';
import type { Booking, DashboardStats } from '../types';

export const dashboardApi = {
  getStats: () => client.get<DashboardStats>('/dashboard/stats').then((r) => r.data),

  getRecentBookings: () =>
    client.get<Booking[]>('/dashboard/recent-bookings').then((r) => r.data),

  getBookingsByStatus: () =>
    client.get<Record<string, number>>('/dashboard/bookings-by-status').then((r) => r.data),
};
