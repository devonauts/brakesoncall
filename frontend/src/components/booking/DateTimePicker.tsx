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
  const today = new Date().toISOString().split('T')[0];

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
        <div className="grid grid-cols-3 gap-3">
          {TIME_SLOTS.map((slot) => (
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
      </div>
    </div>
  );
}
