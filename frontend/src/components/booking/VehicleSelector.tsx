import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { vehiclesApi } from '../../api/vehicles';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import type { Vehicle } from '../../types';

interface VehicleSelectorProps {
  selected: number | null;
  onSelect: (vehicle: Vehicle) => void;
}

export function VehicleSelector({ selected, onSelect }: VehicleSelectorProps) {
  const { isAuthenticated } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list(),
    enabled: isAuthenticated,
  });

  const [form, setForm] = useState({ year: '', make: '', model: '', color: '', license_plate: '' });

  const createMutation = useMutation({
    mutationFn: () =>
      vehiclesApi.create({
        year: parseInt(form.year),
        make: form.make,
        model: form.model,
        color: form.color || undefined,
        license_plate: form.license_plate || undefined,
      }),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSelect(vehicle);
      setShowAdd(false);
      setForm({ year: '', make: '', model: '', color: '', license_plate: '' });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Select Your Vehicle</h2>

      {!isAuthenticated && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
          Please log in to select a saved vehicle or add a new one.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vehicles?.map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => onSelect(vehicle)}
            className={clsx(
              'text-left p-5 rounded-2xl border-2 transition-all cursor-pointer',
              selected === vehicle.id
                ? 'border-brand-500 bg-brand-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-brand-300'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Car className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="font-bold text-gray-900">{vehicle.display_name}</h3>
                  <p className="text-sm text-gray-500">
                    {vehicle.color} {vehicle.license_plate && `| ${vehicle.license_plate}`}
                  </p>
                </div>
              </div>
              {selected === vehicle.id && (
                <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
              )}
            </div>
          </button>
        ))}

        {/* Add New */}
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add New Vehicle
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Year"
              placeholder="2024"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
            <Input
              label="Make"
              placeholder="Toyota"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
            />
            <Input
              label="Model"
              placeholder="Camry"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color"
              placeholder="Silver"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <Input
              label="License Plate"
              placeholder="ABC-1234"
              value={form.license_plate}
              onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.year || !form.make || !form.model}
            >
              Save Vehicle
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
