import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Turnstile } from '../ui/Turnstile';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

interface RegisterFormProps {
  skipRedirect?: boolean;
  hideLinks?: boolean;
}

export function RegisterForm({ skipRedirect, hideLinks }: RegisterFormProps) {
  const { register: registerUser } = useAuth({ skipRedirect });
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        turnstile_token: turnstileToken,
      } as any);
      toast('success', 'Account created successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.error || 'Registration failed';
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="first_name"
          label="First Name"
          placeholder="John"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          id="last_name"
          label="Last Name"
          placeholder="Smith"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>
      <Input
        id="reg_email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="phone"
        label="Phone (optional)"
        type="tel"
        placeholder="(512) 000-0000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        id="reg_password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        id="confirm_password"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        error={errors.confirm_password?.message}
        {...register('confirm_password')}
      />
      <Turnstile onVerify={onTurnstileVerify} />
      <Button type="submit" fullWidth loading={loading} size="lg">
        <UserPlus className="w-4 h-4" />
        Create Account
      </Button>
      {!hideLinks && (
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </form>
  );
}
