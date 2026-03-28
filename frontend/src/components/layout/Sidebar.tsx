import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wrench as WrenchIcon,
  CreditCard,
  HardHat,
  ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/authStore';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/backoffice/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/backoffice/my-jobs', icon: <ClipboardList className="w-5 h-5" />, label: 'My Jobs', roles: ['technician'] },
  { to: '/backoffice/bookings', icon: <CalendarDays className="w-5 h-5" />, label: 'Bookings' },
  { to: '/backoffice/customers', icon: <Users className="w-5 h-5" />, label: 'Customers', roles: ['admin', 'assistant'] },
  { to: '/backoffice/technicians', icon: <HardHat className="w-5 h-5" />, label: 'Technicians', roles: ['admin', 'assistant'] },
  { to: '/backoffice/services', icon: <WrenchIcon className="w-5 h-5" />, label: 'Services', roles: ['admin'] },
  { to: '/backoffice/payments', icon: <CreditCard className="w-5 h-5" />, label: 'Payments', roles: ['admin', 'assistant'] },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-64 bg-dark min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link to="/backoffice/dashboard" className="flex items-center gap-2">
          <img src="/brakesoncall.png" alt="Brakes on Call" className="h-10 w-auto" />
          <span className="text-brand-500 text-[10px] font-bold uppercase tracking-wider">Back Office</span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center">
            <span className="text-brand-500 font-semibold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
