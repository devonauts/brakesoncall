import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    pending: 'warning',
    confirmed: 'info',
    assigned: 'purple',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
    failed: 'danger',
    refunded: 'default',
    processing: 'info',
  };

  return (
    <Badge variant={variantMap[status] || 'default'}>
      {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  );
}
