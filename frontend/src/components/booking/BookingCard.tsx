import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';
import type { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  linkPrefix?: string;
}

export function BookingCard({ booking, linkPrefix = '/account/bookings' }: BookingCardProps) {
  return (
    <Link
      to={`${linkPrefix}/${booking.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-200 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">
            {booking.service?.name || 'Brake Service'}
          </h3>
          <p className="text-sm text-gray-500">
            {booking.vehicle?.display_name || 'Vehicle'}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          {format(parseISO(booking.scheduled_date), 'MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {booking.scheduled_time_slot}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {booking.city}, {booking.state}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="font-bold text-brand-500">${booking.total_price?.toFixed(2)}</span>
        <span className="flex items-center gap-1 text-sm text-brand-500 font-medium">
          View Details <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
