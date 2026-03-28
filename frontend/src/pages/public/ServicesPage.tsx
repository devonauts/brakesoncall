import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';
import { servicesApi } from '../../api/services';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

export function ServicesPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-dark py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Our Services
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Professional brake services delivered to your location. All services include inspection, quality parts, and photo documentation.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <PageSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg hover:border-brand-200 transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{service.description}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-extrabold text-brand-500">
                      ${service.base_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Clock className="w-4 h-4" />
                    ~{service.estimated_duration_minutes} minutes
                  </div>
                  <ul className="space-y-2 mb-8">
                    {[
                      'Professional installation',
                      'Premium brake parts',
                      'Full system inspection',
                      'Photo documentation of work',
                      '12-month warranty',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/book">
                    <Button fullWidth>Book This Service</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
