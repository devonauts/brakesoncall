import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, LogIn, Phone, CreditCard, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery } from '@tanstack/react-query';
import { ServiceSelector } from './ServiceSelector';
import { VehicleSelector } from './VehicleSelector';
import { DateTimePicker } from './DateTimePicker';
import { AddressForm } from './AddressForm';
import { BookingSummary } from './BookingSummary';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { useCreateBooking } from '../../hooks/useBookings';
import { useAuthStore } from '../../stores/authStore';
import client from '../../api/client';
import type { Service, Vehicle, Booking } from '../../types';

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
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Check if Stripe is enabled
  const { data: stripeStatus } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () => client.get('/payments/stripe-status').then((r) => r.data),
  });

  const stripeEnabled = stripeStatus?.enabled ?? false;

  // Steps: 0=Service, 1=Account, 2=Vehicle, 3=Schedule, 4=Review, 5=Confirmation
  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedService;
      case 1: return isAuthenticated;
      case 2: return !!selectedVehicle;
      case 3: return !!date && !!timeSlot && !!addressData.address && !!addressData.city && !!addressData.state && !!addressData.zip_code;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 0 && isAuthenticated) {
      setStep(2);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
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
      setCreatedBooking(booking);
      setStep(5); // Go to confirmation/payment step
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Failed to create booking');
    }
  };

  const handleStripePayment = async () => {
    if (!createdBooking) return;
    setPaymentLoading(true);
    try {
      const { data } = await client.post('/payments/create-intent', {
        booking_id: createdBooking.id,
      });
      // In production, you'd use Stripe.js Elements here to confirm the payment.
      // For now, simulate a successful payment confirmation.
      await client.post('/payments/confirm-intent', {
        booking_id: createdBooking.id,
        payment_intent_id: data.payment_intent_id,
      });
      toast('success', 'Payment successful! Your booking is confirmed.');
      navigate(`/account/bookings/${createdBooking.id}`);
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Payment failed. Please call us to complete payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Determine visible steps for the indicator
  const baseSteps = ['Service', 'Vehicle', 'Schedule', 'Review', 'Confirm'];
  const visibleSteps = isAuthenticated
    ? baseSteps
    : ['Service', 'Account', 'Vehicle', 'Schedule', 'Review', 'Confirm'];

  const displayStepIndex = (() => {
    if (isAuthenticated) {
      if (step <= 0) return 0;
      if (step === 5) return 4;
      return step - 1;
    }
    return Math.min(step, visibleSteps.length - 1);
  })();

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

        {/* Step 5: Confirmation & Payment */}
        {step === 5 && createdBooking && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Booking Created!</h2>
              <p className="text-gray-500 mt-1">
                Booking #{createdBooking.id} has been submitted successfully.
              </p>
            </div>

            {/* Booking Summary Card */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="font-bold text-gray-900">{selectedService?.name}</p>
                  <p className="text-sm text-gray-500">
                    {date} | {timeSlot} | {addressData.city}, {addressData.state}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-gray-500">Total</span>
                <span className="text-2xl font-extrabold text-brand-500">
                  ${createdBooking.total_price?.toFixed(2)}
                </span>
              </div>
            </Card>

            {/* Payment Section */}
            {stripeEnabled ? (
              /* Stripe Payment */
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <CreditCard className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Pay Online</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Secure payment powered by Stripe. Pay now to confirm your appointment.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleStripePayment}
                    loading={paymentLoading}
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay ${createdBooking.total_price?.toFixed(2)} Now
                  </Button>
                  <p className="text-xs text-gray-400">
                    Your card will be charged immediately. Refunds available within 24 hours of service.
                  </p>
                </div>
              </Card>
            ) : (
              /* No Stripe — Call to Confirm */
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Phone className="w-7 h-7 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Call Us to Confirm</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Your booking has been received! Please call us to confirm your appointment and arrange payment.
                    </p>
                  </div>
                  <a href="tel:+15126309050">
                    <Button size="lg" fullWidth>
                      <Phone className="w-5 h-5" />
                      Call (512) 630-9050
                    </Button>
                  </a>
                  <div className="hidden sm:flex flex-col items-center gap-2 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <QRCodeSVG
                        value="tel:+15126309050"
                        size={140}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#141414"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Scan with your phone to call</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">What happens next?</p>
                    <p>1. Our team will confirm your booking within 1 hour</p>
                    <p>2. We'll assign a technician for your time slot</p>
                    <p>3. Payment is collected after service is complete</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Go to Dashboard */}
            <div className="text-center">
              <Link to="/account/bookings">
                <Button variant="ghost">
                  View My Bookings
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons — hidden on confirmation step */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>

          {step === 1 && !isAuthenticated ? (
            <Button disabled>
              Create Account to Continue
            </Button>
          ) : step < 4 ? (
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
      )}
    </div>
  );
}
