import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Clock } from 'lucide-react';
import { servicesApi } from '../../api/services';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export function BackofficeServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', base_price: '', estimated_duration_minutes: '', is_active: true,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description,
        base_price: parseFloat(form.base_price),
        estimated_duration_minutes: parseInt(form.estimated_duration_minutes),
        is_active: form.is_active,
      };
      return editId ? servicesApi.update(editId, payload) : servicesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowModal(false);
      toast('success', editId ? 'Service updated!' : 'Service created!');
    },
  });

  const openEdit = (s: any) => {
    setForm({
      name: s.name, description: s.description || '',
      base_price: String(s.base_price), estimated_duration_minutes: String(s.estimated_duration_minutes),
      is_active: s.is_active,
    });
    setEditId(s.id);
    setShowModal(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Services</h1>
        <Button onClick={() => {
          setForm({ name: '', description: '', base_price: '', estimated_duration_minutes: '60', is_active: true });
          setEditId(null);
          setShowModal(true);
        }}>
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services?.map((s) => (
          <Card key={s.id} hover>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  <Badge variant={s.is_active ? 'success' : 'default'}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{s.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xl font-extrabold text-brand-500">${s.base_price.toFixed(2)}</span>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" /> {s.estimated_duration_minutes} min
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Service' : 'Add New Service'}
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Price ($)" type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
            <Input label="Duration (min)" type="number" value={form.estimated_duration_minutes} onChange={(e) => setForm({ ...form, estimated_duration_minutes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              {editId ? 'Update' : 'Create'} Service
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
