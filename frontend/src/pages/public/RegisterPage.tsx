import { Link } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { Navbar } from '../../components/layout/Navbar';

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/brakesoncall.png" alt="Brakes on Call" className="h-14 w-auto" />
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Create Your Account</h1>
            <p className="text-gray-500 mt-1">Join Brakes on Call and book your first service</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
