import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { ServiceSelector } from './ServiceSelector';
import { VehicleSelector } from './VehicleSelector';
import { DateTimePicker } from './DateTimePicker';
import { AddressForm } from './AddressForm';
import { BookingSummary } from './BookingSummary';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useCreateBooking } from '../../hooks/useBookings';
import { useAuthStore } from '../../stores/authStore';
import type { Service, Vehicle } from '../../types';

const STEPS = ['Service', 'Account', 'Vehicle', 'Schedule', 'Review'];

export function BookingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [notes, setNotes] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Skip account step if already logged in
  const effectiveStep = () => {
    if (isAuthenticated && step >= 1) return step;
    return step;
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!selectedService;
      case 1:
        return isAuthenticated;
      case 2:
        return !!selectedVehicle;
      case 3:
        return !!date && !!timeSlot && !!addressData.address && !!addressData.city && !!addressData.state && !!addressData.zip_code;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    // If user is already authenticated and on service step, skip account step
    if (step === 0 && isAuthenticated) {
      setStep(2);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    // If user is authenticated and on vehicle step, skip back to service step
    if (step === 2 && isAuthenticated) {
      setStep(0);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const booking = await createBooking.mutateAsync({
        service_id: selectedService!.id,
        vehicle_id: selectedVehicle!.id,
        scheduled_date: date,
        scheduled_time_slot: timeSlot,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        notes: notes || undefined,
      });
      toast('success', 'Booking created successfully!');
      navigate(`/account/bookings/${booking.id}`);
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Failed to create booking');
    }
  };

  // Determine visible steps for the indicator
  const visibleSteps = isAuthenticated
    ? ['Service', 'Vehicle', 'Schedule', 'Review']
    : STEPS;

  const displayStepIndex = isAuthenticated
    ? step <= 0 ? 0 : step - 1
    : step;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10">
        {visibleSteps.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i < displayStepIndex
                    ? 'bg-green-500 text-white'
                    : i === displayStepIndex
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {i < displayStepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium mt-2',
                  i <= displayStepIndex ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-3 rounded',
                  i < displayStepIndex ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {/* Step 0: Service Selection */}
        {step === 0 && (
          <ServiceSelector
            selected={selectedService?.id ?? null}
            onSelect={setSelectedService}
          />
        )}

        {/* Step 1: Account (login/register) — only shown if not authenticated */}
        {step === 1 && !isAuthenticated && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create an Account to Continue</h2>
              <p className="text-gray-500 mt-1">
                You need an account to save your vehicle, track your booking, and manage payments.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
              {/* Toggle between login and register */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setAuthMode('register')}
                  className={clsx(
                    'flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer',
                    authMode === 'register'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  )}
                >
                  New Account
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={clsx(
                    'flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer',
                    authMode === 'login'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  )}
                >
                  I Have an Account
                </button>
              </div>

              {authMode === 'register'
                ? <RegisterForm skipRedirect hideLinks />
                : <LoginForm skipRedirect hideLinks />
              }
            </div>

            {isAuthenticated && (
              <div className="text-center">
                <p className="text-green-600 font-semibold mb-3">
                  <CheckCircle className="w-5 h-5 inline mr-1" />
                  Welcome, {user?.first_name}! You're all set.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Account — already authenticated (auto-advance) */}
        {step === 1 && isAuthenticated && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              Logged in as {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500 mt-1">{user?.email}</p>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <VehicleSelector
            selected={selectedVehicle?.id ?? null}
            onSelect={setSelectedVehicle}
          />
        )}

        {/* Step 3: Schedule & Address */}
        {step === 3 && (
          <div className="space-y-6">
            <DateTimePicker
              date={date}
              timeSlot={timeSlot}
              onDateChange={setDate}
              onTimeSlotChange={setTimeSlot}
            />
            <AddressForm
              address={addressData.address}
              city={addressData.city}
              state={addressData.state}
              zipCode={addressData.zip_code}
              onChange={(field, value) => setAddressData({ ...addressData, [field]: value })}
            />
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <BookingSummary
              service={selectedService}
              vehicle={selectedVehicle}
              date={date}
              timeSlot={timeSlot}
              address={addressData.address}
              city={addressData.city}
              state={addressData.state}
              zipCode={addressData.zip_code}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                rows={3}
                placeholder="Any special instructions for the technician..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        {step === 1 && !isAuthenticated ? (
          // On account step, the auth forms handle navigation internally.
          // Show a subtle "continue" that only works once authenticated.
          <Button disabled>
            Create Account to Continue
          </Button>
        ) : step < (isAuthenticated ? 4 : 4) && step !== 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Continue
          </Button>
        ) : step === 4 ? (
          <Button
            onClick={handleSubmit}
            loading={createBooking.isPending}
            disabled={!canProceed()}
            size="lg"
          >
            Confirm Booking
          </Button>
        ) : null}
      </div>
    </div>
  );
}
