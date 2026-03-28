export type UserRole = 'customer' | 'admin' | 'assistant' | 'technician';

export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'card' | 'cash' | 'invoice';

export type StepStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  customer_id: number;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  license_plate: string | null;
  vin: string | null;
  notes: string | null;
  display_name: string;
  created_at: string;
  updated_at: string;
  owner?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  base_price: number;
  estimated_duration_minutes: number;
  is_active: boolean;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  customer_id: number;
  vehicle_id: number;
  service_id: number;
  technician_id: number | null;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_time_slot: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
  customer?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'phone'>;
  technician?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'phone'> | null;
  vehicle?: Pick<Vehicle, 'id' | 'year' | 'make' | 'model' | 'color' | 'license_plate' | 'display_name'>;
  service?: Pick<Service, 'id' | 'name' | 'base_price' | 'estimated_duration_minutes'>;
}

export interface ServiceRecord {
  id: number;
  booking_id: number;
  technician_id: number;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  customer_signature_url: string | null;
  created_at: string;
  steps: ServiceStep[];
  technician_user?: Pick<User, 'id' | 'first_name' | 'last_name'>;
}

export interface ServiceStep {
  id: number;
  service_record_id: number;
  step_number: number;
  title: string;
  description: string;
  photo_url: string | null;
  status: StepStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  booking?: Pick<Booking, 'id' | 'status' | 'scheduled_date' | 'total_price'>;
}

export interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  total_customers: number;
  total_technicians: number;
  monthly_bookings: number;
  monthly_revenue: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface BookingCreateData {
  vehicle_id: number;
  service_id: number;
  scheduled_date: string;
  scheduled_time_slot: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes?: string;
}

export interface VehicleCreateData {
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  license_plate?: string;
  vin?: string;
  notes?: string;
}

export const TIME_SLOTS = [
  '08:00-10:00', '09:00-11:00', '10:00-12:00',
  '11:00-13:00', '12:00-14:00', '13:00-15:00',
  '14:00-16:00', '15:00-17:00', '16:00-18:00',
] as const;

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};
