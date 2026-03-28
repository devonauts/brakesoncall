import client from './client';
import type { Service, ServiceRecord } from '../types';

export const servicesApi = {
  list: () => client.get<Service[]>('/services').then((r) => r.data),

  listAll: () => client.get<Service[]>('/services/all').then((r) => r.data),

  get: (id: number) => client.get<Service>(`/services/${id}`).then((r) => r.data),

  create: (data: Partial<Service>) =>
    client.post<Service>('/services', data).then((r) => r.data),

  update: (id: number, data: Partial<Service>) =>
    client.put<Service>(`/services/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/services/${id}`).then((r) => r.data),

  getRecord: (bookingId: number) =>
    client.get<ServiceRecord>(`/service-records/booking/${bookingId}`).then((r) => r.data),
};
