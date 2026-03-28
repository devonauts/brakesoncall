import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardHat, Phone, Mail, Plus, Edit, UserX, UserCheck } from 'lucide-react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import type { PaginatedResponse, User } from '../../types';

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', password: '' };

export function TechniciansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'technician'],
    queryFn: () =>
      client.get<PaginatedResponse<User>>('/users', { params: { role: 'technician' } }).then((r) => r.data),
  });

  const technicians = data?.items || [];

  const createMutation = useMutation({
    mutationFn: () =>
      client.post('/users', { ...form, role: 'technician' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm(emptyForm);
      toast('success', 'Technician created!');
    },
    onError: (err: any) => {
      toast('error', err.response?.data?.errors?.email?.[0] || 'Failed to create technician');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      client.put(`/users/${editingUser!.id}`, {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        ...(form.password ? { password: form.password } : {}),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      setForm(emptyForm);
      toast('success', 'Technician updated!');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) =>
      client.put(`/users/${userId}/toggle-active`).then((r) => r.data),
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('success', user.is_active ? 'Technician activated' : 'Technician deactivated');
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
    });
    setShowModal(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Technicians</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Technician
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => (
          <Card key={tech.id} hover>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center shrink-0">
                <HardHat className="w-7 h-7 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{tech.full_name}</h3>
                  <Badge variant={tech.is_active ? 'success' : 'danger'}>
                    {tech.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" /> {tech.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" /> {tech.phone || 'No phone'}
                  </p>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(tech)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate(tech.id)}
                  >
                    {tech.is_active
                      ? <><UserX className="w-4 h-4 text-red-500" /> Deactivate</>
                      : <><UserCheck className="w-4 h-4 text-green-500" /> Activate</>
                    }
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null); }}
        title={editingUser ? 'Edit Technician' : 'Add New Technician'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          {!editingUser && (
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditingUser(null); }}>Cancel</Button>
            <Button
              onClick={() => editingUser ? updateMutation.mutate() : createMutation.mutate()}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.first_name || !form.last_name || (!editingUser && (!form.email || !form.password))}
            >
              {editingUser ? 'Update' : 'Create'} Technician
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
