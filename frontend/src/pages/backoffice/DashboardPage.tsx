import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  CalendarDays,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Wrench,
  MapPin,
  Car,
  Play,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { bookingsApi } from '../../api/bookings';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: dashboardApi.getRecentBookings,
  });

  if (statsLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your Brakes on Call operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats?.total_bookings, icon: <CalendarDays className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue', value: `$${stats?.total_revenue?.toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
          { label: 'Pending Bookings', value: stats?.pending_bookings, icon: <Clock className="w-6 h-6" />, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Customers', value: stats?.total_customers, icon: <Users className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <span className="text-sm text-gray-500">This Month's Bookings</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats?.monthly_bookings}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-1">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">This Month's Revenue</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">${stats?.monthly_revenue?.toLocaleString()}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          <Link to="/backoffice/bookings" className="text-sm text-brand-500 font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings?.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">
                    <Link to={`/backoffice/bookings/${b.id}`} className="text-brand-500 font-semibold">
                      #{b.id}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {b.customer?.first_name} {b.customer?.last_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{b.service?.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {format(parseISO(b.scheduled_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-3 text-sm font-bold text-right">${b.total_price?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TechnicianDashboard() {
  const { user } = useAuthStore();

  const { data: activeJobs, isLoading: activeLoading } = useQuery({
    queryKey: ['bookings', { status: 'in_progress' }],
    queryFn: () => bookingsApi.list({ status: 'in_progress' }),
  });

  const { data: assignedJobs, isLoading: assignedLoading } = useQuery({
    queryKey: ['bookings', { status: 'assigned' }],
    queryFn: () => bookingsApi.list({ status: 'assigned' }),
  });

  const { data: completedJobs } = useQuery({
    queryKey: ['bookings', { status: 'completed' }],
    queryFn: () => bookingsApi.list({ status: 'completed' }),
  });

  if (activeLoading || assignedLoading) return <PageSpinner />;

  const inProgress = activeJobs?.items || [];
  const assigned = assignedJobs?.items || [];
  const completed = completedJobs?.items || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Welcome, {user?.first_name}!
        </h1>
        <p className="text-gray-500">Here's your job overview for today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-3xl font-extrabold text-brand-500">{inProgress.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50">
              <Play className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned</p>
              <p className="text-3xl font-extrabold text-blue-600">{assigned.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-extrabold text-green-600">{completed.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Jobs - In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            In Progress
          </h2>
          <div className="space-y-4">
            {inProgress.map((booking) => (
              <Card key={booking.id} hover>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={booking.status} />
                      <span className="font-bold text-gray-900">Job #{booking.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="w-4 h-4 text-brand-500" />
                      {booking.service?.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="w-4 h-4 text-brand-500" />
                      {booking.vehicle?.display_name}
                      {booking.vehicle?.color && ` (${booking.vehicle.color})`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-brand-500" />
                      {booking.customer?.first_name} {booking.customer?.last_name}
                      {booking.customer?.phone && ` | ${booking.customer.phone}`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      {booking.address}, {booking.city}, {booking.state} {booking.zip_code}
                    </div>
                  </div>
                  <Link to={`/backoffice/work/${booking.id}`}>
                    <Button>Continue Work</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Assigned Jobs */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Jobs</h2>
        {assigned.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-8 h-8 text-gray-400" />}
            title="No upcoming jobs"
            description="You'll see assigned jobs here once dispatch sends them your way."
          />
        ) : (
          <div className="space-y-4">
            {assigned.map((booking) => (
              <Card key={booking.id} hover>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={booking.status} />
                      <span className="font-bold text-gray-900">Job #{booking.id}</span>
                      <span className="text-sm text-gray-400">
                        {format(parseISO(booking.scheduled_date), 'EEE, MMM d')} | {booking.scheduled_time_slot}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="w-4 h-4 text-brand-500" />
                      {booking.service?.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="w-4 h-4 text-brand-500" />
                      {booking.vehicle?.display_name}
                      {booking.vehicle?.color && ` (${booking.vehicle.color})`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-brand-500" />
                      {booking.customer?.first_name} {booking.customer?.last_name}
                      {booking.customer?.phone && ` | ${booking.customer.phone}`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      {booking.address}, {booking.city}, {booking.state} {booking.zip_code}
                    </div>
                  </div>
                  <Link to={`/backoffice/work/${booking.id}`}>
                    <Button variant="outline">Start Job</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.slice(0, 4).map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <span className="font-semibold text-gray-900">#{booking.id}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{booking.service?.name}</p>
                    <p className="text-sm text-gray-400">
                      {booking.customer?.first_name} {booking.customer?.last_name} | {booking.vehicle?.display_name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-500">${booking.total_price?.toFixed(2)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BackofficeDashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'technician') {
    return <TechnicianDashboard />;
  }

  return <AdminDashboard />;
}
