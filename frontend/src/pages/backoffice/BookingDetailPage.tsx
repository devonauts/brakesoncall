import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, User, MapPin, CalendarDays, Wrench, Car } from 'lucide-react';
import { useBooking, useAssignTechnician, useUpdateBookingStatus } from '../../hooks/useBookings';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import client from '../../api/client';
import type { User as UserType } from '../../types';

export function BackofficeBookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { data: booking, isLoading } = useBooking(Number(id));
  const assignMutation = useAssignTechnician();
  const statusMutation = useUpdateBookingStatus();
  const [techId, setTechId] = useState('');

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => client.get<UserType[]>('/technicians').then((r) => r.data),
    enabled: user?.role === 'admin' || user?.role === 'assistant',
  });

  if (isLoading) return <PageSpinner />;
  if (!booking) return null;

  const handleAssign = async () => {
    try {
      await assignMutation.mutateAsync({ id: booking.id, technician_id: parseInt(techId) });
      toast('success', 'Technician assigned!');
    } catch {
      toast('error', 'Failed to assign technician');
    }
  };

  const handleStatus = async (status: string) => {
    try {
      await statusMutation.mutateAsync({ id: booking.id, status });
      toast('success', `Status updated to ${status}`);
    } catch {
      toast('error', 'Failed to update status');
    }
  };

  const isTechnician = user?.role === 'technician';

  return (
    <div className="space-y-6">
      <Link to="/backoffice/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Booking #{booking.id}</h1>
          <p className="text-gray-500">Created {format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a')}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold mb-4">Booking Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-semibold">{booking.service?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="font-semibold">{booking.vehicle?.display_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-gray-500">Date & Time</p>
                  <p className="font-semibold">{format(parseISO(booking.scheduled_date), 'MMM d, yyyy')} | {booking.scheduled_time_slot}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-semibold">{booking.address}, {booking.city}, {booking.state} {booking.zip_code}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4">Customer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="font-semibold">{booking.customer?.first_name} {booking.customer?.last_name}</p>
                <p className="text-sm text-gray-500">{booking.customer?.email} | {booking.customer?.phone}</p>
              </div>
            </div>
          </Card>

          {booking.notes && (
            <Card>
              <h3 className="font-bold mb-2">Notes</h3>
              <p className="text-gray-600">{booking.notes}</p>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold mb-4">Price</h3>
            <p className="text-3xl font-extrabold text-brand-500">${booking.total_price?.toFixed(2)}</p>
          </Card>

          {/* Assign Technician */}
          {!isTechnician && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <Card>
              <h3 className="font-bold mb-4">Assign Technician</h3>
              <div className="space-y-3">
                <Select
                  id="technician"
                  options={technicians?.map((t) => ({ value: String(t.id), label: `${t.first_name} ${t.last_name}` })) || []}
                  placeholder="Select technician"
                  value={techId}
                  onChange={(e) => setTechId(e.target.value)}
                />
                <Button fullWidth onClick={handleAssign} loading={assignMutation.isPending} disabled={!techId}>
                  Assign
                </Button>
              </div>
              {booking.technician && (
                <p className="text-sm text-gray-500 mt-3">
                  Currently: {booking.technician.first_name} {booking.technician.last_name}
                </p>
              )}
            </Card>
          )}

          {/* Status Actions */}
          <Card>
            <h3 className="font-bold mb-4">Actions</h3>
            <div className="space-y-2">
              {booking.status === 'pending' && (
                <Button fullWidth variant="primary" onClick={() => handleStatus('confirmed')}>
                  Confirm Booking
                </Button>
              )}
              {booking.status === 'assigned' && isTechnician && (
                <Link to={`/backoffice/work/${booking.id}`}>
                  <Button fullWidth variant="primary">Start Service</Button>
                </Link>
              )}
              {booking.status === 'in_progress' && isTechnician && (
                <Link to={`/backoffice/work/${booking.id}`}>
                  <Button fullWidth variant="primary">Continue Service</Button>
                </Link>
              )}
              {!['completed', 'cancelled'].includes(booking.status) && (
                <Button fullWidth variant="danger" onClick={() => handleStatus('cancelled')}>
                  Cancel Booking
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
