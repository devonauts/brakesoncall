import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Wrench, Car, MapPin, Users, CalendarDays, Phone, Clock } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function MyJobsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBookings({ page, status: status || undefined });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">My Jobs</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              status === f.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8 text-gray-400" />}
          title="No jobs found"
          description={status ? `No ${status.replace('_', ' ')} jobs.` : 'No jobs assigned to you yet.'}
        />
      ) : (
        <div className="space-y-4">
          {data?.items.map((booking) => (
            <Card key={booking.id} hover>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={booking.status} />
                    <span className="font-bold text-gray-900 text-lg">Job #{booking.id}</span>
                    <span className="text-sm text-gray-400">
                      {format(parseISO(booking.scheduled_date), 'EEE, MMM d, yyyy')} | {booking.scheduled_time_slot}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="w-4 h-4 text-brand-500 shrink-0" />
                      <span className="font-medium">{booking.service?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="w-4 h-4 text-brand-500 shrink-0" />
                      {booking.vehicle?.display_name}
                      {booking.vehicle?.color && <span className="text-gray-400">({booking.vehicle.color})</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-brand-500 shrink-0" />
                      {booking.customer?.first_name} {booking.customer?.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                      {booking.customer?.phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                      {booking.address}, {booking.city}, {booking.state} {booking.zip_code}
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-gray-400 italic mt-1">Note: {booking.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <span className="text-xl font-extrabold text-brand-500 text-right">
                    ${booking.total_price?.toFixed(2)}
                  </span>
                  {booking.status === 'assigned' && (
                    <Link to={`/backoffice/work/${booking.id}`}>
                      <Button fullWidth>Start Job</Button>
                    </Link>
                  )}
                  {booking.status === 'in_progress' && (
                    <Link to={`/backoffice/work/${booking.id}`}>
                      <Button fullWidth>Continue Work</Button>
                    </Link>
                  )}
                  {booking.status === 'completed' && (
                    <Link to={`/backoffice/bookings/${booking.id}`}>
                      <Button variant="ghost" fullWidth>View Details</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={!data.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {data.page} of {data.pages}</span>
          <Button variant="ghost" size="sm" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
