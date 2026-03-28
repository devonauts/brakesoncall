import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Plus, Edit, UserX, UserCheck } from 'lucide-react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import type { PaginatedResponse, User } from '../../types';

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', password: '' };

export function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'customer', search, page],
    queryFn: () =>
      client
        .get<PaginatedResponse<User>>('/users', { params: { role: 'customer', search: search || undefined, page } })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      client.post('/users', { ...form, role: 'customer' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm(emptyForm);
      toast('success', 'Customer created!');
    },
    onError: (err: any) => {
      toast('error', err.response?.data?.errors?.email?.[0] || 'Failed to create customer');
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
      toast('success', 'Customer updated!');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) =>
      client.put(`/users/${userId}/toggle-active`).then((r) => r.data),
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('success', user.is_active ? 'Customer activated' : 'Customer deactivated');
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
        <h1 className="text-2xl font-extrabold text-gray-900">Customers</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {data?.items.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8 text-gray-400" />} title="No customers found" />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{u.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate(u.id)}
                        >
                          {u.is_active
                            ? <UserX className="w-4 h-4 text-red-500" />
                            : <UserCheck className="w-4 h-4 text-green-500" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={!data.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {data.page} of {data.pages}</span>
          <Button variant="ghost" size="sm" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null); }}
        title={editingUser ? 'Edit Customer' : 'Add New Customer'}
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
              {editingUser ? 'Update' : 'Create'} Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
