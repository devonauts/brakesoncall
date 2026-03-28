import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import { Card, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await authApi.updateMe(form);
      setUser(updated);
      toast('success', 'Profile updated!');
    } catch {
      toast('error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-gray-900">Profile Settings</h1>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <Badge variant="info" className="mt-1">{user?.role}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first_name"
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              id="last_name"
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          <Input
            id="phone"
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            id="email"
            label="Email"
            value={user?.email || ''}
            disabled
          />
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
