import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBooking, useUpdateBookingStatus } from '../../hooks/useBookings';
import { ServiceWorkflow } from '../../components/technician/ServiceWorkflow';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export function TechnicianWorkPage() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { data: booking, isLoading } = useBooking(bookingId);
  const statusMutation = useUpdateBookingStatus();
  const { toast } = useToast();

  if (isLoading) return <PageSpinner />;
  if (!booking) return <p>Booking not found</p>;

  const handleStartWork = async () => {
    try {
      await statusMutation.mutateAsync({ id: bookingId, status: 'in_progress' });
      toast('success', 'Service started! Complete each step below.');
    } catch {
      toast('error', 'Failed to start service');
    }
  };

  const handleComplete = async () => {
    try {
      await statusMutation.mutateAsync({ id: bookingId, status: 'completed' });
      toast('success', 'Service completed!');
    } catch {
      toast('error', 'Failed to complete service');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/backoffice/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {/* Booking Summary */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              Service Job #{booking.id}
            </h1>
            <p className="text-gray-500">
              {booking.service?.name} | {booking.vehicle?.display_name}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {booking.address}, {booking.city}, {booking.state}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </Card>

      {/* Start Work Button */}
      {booking.status === 'assigned' && (
        <Button fullWidth size="lg" onClick={handleStartWork} loading={statusMutation.isPending}>
          Start Service
        </Button>
      )}

      {/* Workflow Steps */}
      {(booking.status === 'in_progress' || booking.status === 'completed') && (
        <ServiceWorkflow bookingId={bookingId} />
      )}

      {/* Complete Button */}
      {booking.status === 'in_progress' && (
        <Button fullWidth size="lg" variant="secondary" onClick={handleComplete} loading={statusMutation.isPending}>
          Complete Service
        </Button>
      )}
    </div>
  );
}
