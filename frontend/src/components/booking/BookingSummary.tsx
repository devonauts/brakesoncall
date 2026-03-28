import { format, parseISO } from 'date-fns';
import { CalendarDays, Clock, MapPin, Car, Wrench } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Service, Vehicle } from '../../types';

interface BookingSummaryProps {
  service: Service | null;
  vehicle: Vehicle | null;
  date: string;
  timeSlot: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export function BookingSummary({
  service,
  vehicle,
  date,
  timeSlot,
  address,
  city,
  state,
  zipCode,
}: BookingSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Review Your Booking</h2>

      <Card>
        <div className="space-y-4">
          {/* Service */}
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Service</p>
              <p className="font-bold text-gray-900">{service?.name}</p>
            </div>
          </div>

          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Vehicle</p>
              <p className="font-bold text-gray-900">{vehicle?.display_name}</p>
            </div>
          </div>

          {/* Date/Time */}
          <div className="flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date & Time</p>
              <p className="font-bold text-gray-900">
                {date ? format(parseISO(date), 'EEEE, MMMM d, yyyy') : '-'} | {timeSlot}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Service Location</p>
              <p className="font-bold text-gray-900">
                {address}, {city}, {state} {zipCode}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-2xl font-extrabold text-brand-500">
                ${service?.base_price.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Payment collected after service completion
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
