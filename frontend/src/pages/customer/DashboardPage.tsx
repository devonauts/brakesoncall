import { Link } from 'react-router-dom';
import { CalendarDays, Car, CreditCard, ArrowRight, Plus } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingCard } from '../../components/booking/BookingCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

export function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useBookings({ page: 1 });

  const upcomingBookings = data?.items.filter((b) =>
    ['pending', 'confirmed', 'assigned'].includes(b.status)
  ) || [];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-500">Here's an overview of your account.</p>
        </div>
        <Link to="/book">
          <Button>
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <CalendarDays className="w-6 h-6 text-brand-500" />, label: 'Total Bookings', value: data?.total || 0, to: '/account/bookings' },
          { icon: <Car className="w-6 h-6 text-brand-500" />, label: 'Upcoming', value: upcomingBookings.length, to: '/account/bookings' },
          { icon: <CreditCard className="w-6 h-6 text-brand-500" />, label: 'Quick Actions', value: 'Book Now', to: '/book' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card hover>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Upcoming Bookings</CardTitle>
          <Link to="/account/bookings" className="text-sm text-brand-500 font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <EmptyState
            title="No upcoming bookings"
            description="Book your first brake service today!"
            action={
              <Link to="/book">
                <Button size="sm">Book Now</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.slice(0, 4).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
