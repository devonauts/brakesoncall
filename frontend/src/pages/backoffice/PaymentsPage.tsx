import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CreditCard, Settings, RotateCcw, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { paymentsApi } from '../../api/payments';
import client from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export function BackofficePaymentsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeForm, setStripeForm] = useState({ secret_key: '', publishable_key: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsApi.list({ page }),
  });

  const { data: stripeConfig } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: () => client.get('/payments/stripe-config').then((r) => r.data),
    enabled: user?.role === 'admin',
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId: number) => paymentsApi.refund(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast('success', 'Payment refunded');
    },
    onError: (err: any) => {
      toast('error', err.response?.data?.error || 'Refund failed');
    },
  });

  const stripeConfigMutation = useMutation({
    mutationFn: () => client.put('/payments/stripe-config', stripeForm).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-config'] });
      setShowStripeModal(false);
      setStripeForm({ secret_key: '', publishable_key: '' });
      toast('success', 'Stripe configuration saved!');
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Payments</h1>
        {user?.role === 'admin' && (
          <Button variant="outline" onClick={() => setShowStripeModal(true)}>
            <Settings className="w-4 h-4" /> Stripe Settings
          </Button>
        )}
      </div>

      {/* Stripe Status Banner */}
      {user?.role === 'admin' && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stripeConfig?.is_configured ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  stripeConfig?.is_configured ? 'text-green-600' : 'text-yellow-600'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stripe Payment Gateway</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {stripeConfig?.is_configured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Connected and active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 font-medium">Not configured — payments will be recorded manually</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowStripeModal(true)}>
              Configure
            </Button>
          </div>
        </Card>
      )}

      {/* Payments Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Booking</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                {user?.role === 'admin' && (
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold">#{p.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">#{p.booking_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.paid_at ? format(parseISO(p.paid_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                    {p.payment_method === 'card' && p.transaction_id?.startsWith('pi_')
                      ? '💳 Stripe'
                      : p.payment_method
                    }
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                    {p.transaction_id || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-right">${p.amount.toFixed(2)}</td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      {p.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to refund this payment?')) {
                              refundMutation.mutate(p.id);
                            }
                          }}
                          loading={refundMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4 text-red-500" /> Refund
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={!data.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {data.page} of {data.pages}</span>
          <Button variant="ghost" size="sm" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Stripe Configuration Modal */}
      <Modal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        title="Stripe Payment Configuration"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-1">Connect your Stripe account</h4>
            <p className="text-sm text-blue-700">
              Enter your Stripe API keys to enable online card payments. You can find these in your{' '}
              <span className="font-semibold">Stripe Dashboard &rarr; Developers &rarr; API Keys</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Publishable Key</label>
              </div>
              <Input
                placeholder="pk_live_... or pk_test_..."
                value={stripeForm.publishable_key}
                onChange={(e) => setStripeForm({ ...stripeForm, publishable_key: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">Used in the frontend to initialize Stripe Elements</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Secret Key</label>
              </div>
              <Input
                type="password"
                placeholder="sk_live_... or sk_test_..."
                value={stripeForm.secret_key}
                onChange={(e) => setStripeForm({ ...stripeForm, secret_key: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">Stored securely on the server, never exposed to the frontend</p>
            </div>
          </div>

          {stripeConfig?.is_configured && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700 font-medium">
                Stripe is currently connected. Updating will replace existing keys.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStripeModal(false)}>Cancel</Button>
            <Button
              onClick={() => stripeConfigMutation.mutate()}
              loading={stripeConfigMutation.isPending}
              disabled={!stripeForm.secret_key || !stripeForm.publishable_key}
            >
              Save Stripe Configuration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
