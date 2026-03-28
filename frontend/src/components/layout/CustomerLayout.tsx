import { Outlet, Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  CreditCard,
  UserCircle,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const tabs = [
  { to: '/account/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/account/bookings', icon: <CalendarDays className="w-4 h-4" />, label: 'Bookings' },
  { to: '/account/vehicles', icon: <Car className="w-4 h-4" />, label: 'Vehicles' },
  { to: '/account/payments', icon: <CreditCard className="w-4 h-4" />, label: 'Payments' },
  { to: '/account/profile', icon: <UserCircle className="w-4 h-4" />, label: 'Profile' },
];

export function CustomerLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
            {tabs.map((tab) => {
              const active = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 -mb-px',
                    active
                      ? 'border-brand-500 text-brand-600 bg-brand-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
