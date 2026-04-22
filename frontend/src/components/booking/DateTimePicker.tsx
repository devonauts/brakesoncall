import { clsx } from 'clsx';
import { Clock, CheckCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { TIME_SLOTS } from '../../types';

interface DateTimePickerProps {
  date: string;
  timeSlot: string;
  onDateChange: (date: string) => void;
  onTimeSlotChange: (slot: string) => void;
}

export function DateTimePicker({ date, timeSlot, onDateChange, onTimeSlotChange }: DateTimePickerProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === today;

  const availableSlots = TIME_SLOTS.filter((slot) => {
    if (!isToday) return true;
    const [hour, minute] = slot.split('-')[0].split(':').map(Number);
    const start = new Date();
    start.setHours(hour, minute, 0, 0);
    return start > now;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Choose Date & Time</h2>

      <Input
        id="date"
        label="Service Date"
        type="date"
        min={today}
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Time Slot</label>
        {isToday && availableSlots.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
            No more time slots available today. Please choose a later date.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotChange(slot)}
                className={clsx(
                  'flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer',
                  timeSlot === slot
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-200 text-gray-600 hover:border-brand-300'
                )}
              >
                {timeSlot === slot ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
