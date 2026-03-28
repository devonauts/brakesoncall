import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CalendarDays, Clock, MapPin, Car, Wrench, User } from 'lucide-react';
import { useBooking } from '../../hooks/useBookings';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

export function CustomerBookingDetailPage() {
  const { id } = useParams();
  const { data: booking, isLoading } = useBooking(Number(id));

  if (isLoading) return <PageSpinner />;
  if (!booking) return <p>Booking not found</p>;

  const statusSteps = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed'];
  const currentIndex = statusSteps.indexOf(booking.status);

  return (
    <div className="space-y-6">
      <Link to="/account/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Booking #{booking.id}
          </h1>
          <p className="text-gray-500">
            Created {format(parseISO(booking.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Status Tracker */}
      {booking.status !== 'cancelled' && (
        <Card>
          <h3 className="font-bold text-gray-900 mb-4">Booking Status</h3>
          <div className="flex items-center gap-2">
            {statusSteps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i <= currentIndex
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded ${
                      i < currentIndex ? 'bg-brand-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {statusSteps.map((s) => (
              <span key={s} className="text-[10px] text-gray-500 capitalize">
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-gray-900 mb-4">Service Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-semibold">{booking.service?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-semibold">{booking.vehicle?.display_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">
                  {format(parseISO(booking.scheduled_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-semibold">{booking.scheduled_time_slot}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900 mb-4">Location & Payment</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm text-gray-500">Service Address</p>
                <p className="font-semibold">
                  {booking.address}, {booking.city}, {booking.state} {booking.zip_code}
                </p>
              </div>
            </div>
            {booking.technician && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-sm text-gray-500">Assigned Technician</p>
                  <p className="font-semibold">
                    {booking.technician.first_name} {booking.technician.last_name}
                  </p>
                </div>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="text-xl font-extrabold text-brand-500">
                  ${booking.total_price?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {booking.notes && (
        <Card>
          <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-600">{booking.notes}</p>
        </Card>
      )}
    </div>
  );
}
