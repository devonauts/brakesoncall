import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { BookingWizard } from '../../components/booking/BookingWizard';

export function BookingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="bg-dark py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold text-white mb-2">Book Your Brake Service</h1>
            <p className="text-gray-400">Quick and easy — we'll be at your door.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BookingWizard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
