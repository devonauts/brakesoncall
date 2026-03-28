import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { paymentsApi } from '../../api/payments';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

export function CustomerPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list(),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Payment History</h1>

      {data?.items.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-gray-400" />}
          title="No payments yet"
          description="Payments will appear here after your services are completed."
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Booking</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.paid_at ? format(parseISO(payment.paid_at), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">#{payment.booking_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{payment.payment_method}</td>
                    <td className="px-6 py-4"><StatusBadge status={payment.status} /></td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      ${payment.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
