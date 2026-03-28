import { Outlet, Link } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../stores/authStore';

export function BackofficeLayout() {
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">
            Welcome back, {user?.first_name}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Website
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
