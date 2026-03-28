import client from './client';
import type { Vehicle, VehicleCreateData } from '../types';

export const vehiclesApi = {
  list: (customerId?: number) =>
    client
      .get<Vehicle[]>('/vehicles', { params: customerId ? { customer_id: customerId } : {} })
      .then((r) => r.data),

  get: (id: number) => client.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),

  create: (data: VehicleCreateData) =>
    client.post<Vehicle>('/vehicles', data).then((r) => r.data),

  update: (id: number, data: Partial<VehicleCreateData>) =>
    client.put<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),

  delete: (id: number) => client.delete(`/vehicles/${id}`).then((r) => r.data),
};
