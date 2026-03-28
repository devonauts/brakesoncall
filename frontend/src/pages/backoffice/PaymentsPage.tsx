import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CreditCard, Settings, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentsApi } from '../../api/payments';
import client from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export function BackofficePaymentsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsApi.list({ page }),
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () => client.get('/payments/stripe-status').then((r) => r.data),
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

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Payments</h1>
        {user?.role === 'admin' && (
          <Link to="/backoffice/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" /> Configure Integrations
            </Button>
          </Link>
        )}
      </div>

      {/* Stripe Status Banner */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stripeStatus?.enabled ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <CreditCard className={`w-5 h-5 ${
                stripeStatus?.enabled ? 'text-green-600' : 'text-yellow-600'
              }`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Stripe Payment Gateway</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {stripeStatus?.enabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Connected and active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 font-medium">Not configured — payments recorded manually</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Link to="/backoffice/settings">
              <Button size="sm" variant="ghost">Configure</Button>
            </Link>
          )}
        </div>
      </Card>

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
                      ? 'Stripe'
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
    </div>
  );
}
