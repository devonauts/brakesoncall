import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { servicesApi } from '../../api/services';
import { Spinner } from '../ui/Spinner';
import type { Service } from '../../types';

interface ServiceSelectorProps {
  selected: number | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ selected, onSelect }: ServiceSelectorProps) {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Select a Service</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services?.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={clsx(
              'text-left p-5 rounded-2xl border-2 transition-all cursor-pointer',
              selected === service.id
                ? 'border-brand-500 bg-brand-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900">{service.name}</h3>
              {selected === service.id && (
                <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">{service.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold text-brand-500">
                ${service.base_price.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                ~{service.estimated_duration_minutes} min
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
