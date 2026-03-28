import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, Trash2, Edit } from 'lucide-react';
import { vehiclesApi } from '../../api/vehicles';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export function VehiclesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({
    year: '', make: '', model: '', trim: '', color: '', license_plate: '', vin: '',
  });

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => vehiclesApi.create({
      year: parseInt(form.year), make: form.make, model: form.model,
      trim: form.trim || undefined, color: form.color || undefined,
      license_plate: form.license_plate || undefined, vin: form.vin || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      resetForm();
      toast('success', 'Vehicle added!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => vehiclesApi.update(editing!, {
      year: parseInt(form.year), make: form.make, model: form.model,
      trim: form.trim || undefined, color: form.color || undefined,
      license_plate: form.license_plate || undefined, vin: form.vin || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setEditing(null);
      resetForm();
      toast('success', 'Vehicle updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast('success', 'Vehicle removed');
    },
  });

  const resetForm = () => setForm({ year: '', make: '', model: '', trim: '', color: '', license_plate: '', vin: '' });

  const openEdit = (v: any) => {
    setForm({
      year: String(v.year), make: v.make, model: v.model,
      trim: v.trim || '', color: v.color || '',
      license_plate: v.license_plate || '', vin: v.vin || '',
    });
    setEditing(v.id);
    setShowModal(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">My Vehicles</h1>
        <Button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {vehicles?.length === 0 ? (
        <EmptyState
          icon={<Car className="w-8 h-8 text-gray-400" />}
          title="No vehicles yet"
          description="Add your first vehicle to get started with booking."
          action={<Button size="sm" onClick={() => setShowModal(true)}>Add Vehicle</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles?.map((v) => (
            <Card key={v.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{v.display_name}</h3>
                    <p className="text-sm text-gray-500">
                      {[v.trim, v.color].filter(Boolean).join(' | ') || 'No details'}
                    </p>
                  </div>
                </div>
              </div>
              {v.license_plate && (
                <p className="text-sm text-gray-500 mt-3">Plate: {v.license_plate}</p>
              )}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                  <Edit className="w-4 h-4" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(v.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Year" placeholder="2024" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <Input label="Make" placeholder="Toyota" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            <Input label="Model" placeholder="Camry" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Trim" placeholder="SE" value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} />
            <Input label="Color" placeholder="Silver" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="License Plate" placeholder="ABC-1234" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
            <Input label="VIN" placeholder="Optional" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Button>
            <Button
              onClick={() => editing ? updateMutation.mutate() : createMutation.mutate()}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.year || !form.make || !form.model}
            >
              {editing ? 'Update' : 'Add'} Vehicle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
