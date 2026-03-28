import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSpinner } from './components/ui/Spinner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { BackofficeLayout } from './components/layout/BackofficeLayout';

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const BookingPage = lazy(() => import('./pages/public/BookingPage').then((m) => ({ default: m.BookingPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/public/TermsPage').then((m) => ({ default: m.TermsPage })));

// Customer pages
const CustomerDashboard = lazy(() => import('./pages/customer/DashboardPage').then((m) => ({ default: m.CustomerDashboardPage })));
const CustomerBookings = lazy(() => import('./pages/customer/BookingsPage').then((m) => ({ default: m.CustomerBookingsPage })));
const CustomerBookingDetail = lazy(() => import('./pages/customer/BookingDetailPage').then((m) => ({ default: m.CustomerBookingDetailPage })));
const VehiclesPage = lazy(() => import('./pages/customer/VehiclesPage').then((m) => ({ default: m.VehiclesPage })));
const CustomerPayments = lazy(() => import('./pages/customer/PaymentsPage').then((m) => ({ default: m.CustomerPaymentsPage })));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// Backoffice pages
const BackofficeDashboard = lazy(() => import('./pages/backoffice/DashboardPage').then((m) => ({ default: m.BackofficeDashboardPage })));
const BackofficeBookings = lazy(() => import('./pages/backoffice/BookingsPage').then((m) => ({ default: m.BackofficeBookingsPage })));
const BackofficeBookingDetail = lazy(() => import('./pages/backoffice/BookingDetailPage').then((m) => ({ default: m.BackofficeBookingDetailPage })));
const CustomersPage = lazy(() => import('./pages/backoffice/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const TechniciansPage = lazy(() => import('./pages/backoffice/TechniciansPage').then((m) => ({ default: m.TechniciansPage })));
const BackofficeServices = lazy(() => import('./pages/backoffice/ServicesPage').then((m) => ({ default: m.BackofficeServicesPage })));
const BackofficePayments = lazy(() => import('./pages/backoffice/PaymentsPage').then((m) => ({ default: m.BackofficePaymentsPage })));
const TechnicianWork = lazy(() => import('./pages/backoffice/TechnicianWorkPage').then((m) => ({ default: m.TechnicianWorkPage })));
const MyJobsPage = lazy(() => import('./pages/backoffice/MyJobsPage').then((m) => ({ default: m.MyJobsPage })));
const SettingsPage = lazy(() => import('./pages/backoffice/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <Suspense fallback={<PageSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer Routes */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="bookings" element={<CustomerBookings />} />
                <Route path="bookings/:id" element={<CustomerBookingDetail />} />
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="payments" element={<CustomerPayments />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Backoffice Routes */}
              <Route
                path="/backoffice"
                element={
                  <ProtectedRoute roles={['admin', 'assistant', 'technician']}>
                    <BackofficeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BackofficeDashboard />} />
                <Route path="my-jobs" element={<MyJobsPage />} />
                <Route path="bookings" element={<BackofficeBookings />} />
                <Route path="bookings/:id" element={<BackofficeBookingDetail />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="technicians" element={<TechniciansPage />} />
                <Route path="services" element={<BackofficeServices />} />
                <Route path="payments" element={<BackofficePayments />} />
                <Route path="work/:id" element={<TechnicianWork />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
