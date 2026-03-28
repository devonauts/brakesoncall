import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Key,
  Send,
  ExternalLink,
} from 'lucide-react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

interface IntegrationConfig {
  stripe: { is_configured: boolean; publishable_key: string; has_secret_key: boolean };
  sendgrid: { is_configured: boolean; from_email: string };
  turnstile: { is_configured: boolean; site_key: string; has_secret_key: boolean };
}

function StatusIndicator({ configured }: { configured: boolean }) {
  return configured ? (
    <div className="flex items-center gap-1.5 text-green-600">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Connected</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-yellow-600">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Not configured</span>
    </div>
  );
}

function StripeSection({ config }: { config: IntegrationConfig['stripe'] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ publishable_key: '', secret_key: '' });

  const mutation = useMutation({
    mutationFn: () => client.put('/settings/stripe', form).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setForm({ publishable_key: '', secret_key: '' });
      toast('success', 'Stripe settings saved!');
    },
    onError: () => toast('error', 'Failed to save Stripe settings'),
  });

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Stripe Payments</h3>
            <p className="text-sm text-gray-500">Accept online card payments from customers</p>
          </div>
        </div>
        <StatusIndicator configured={config.is_configured} />
      </div>

      {config.is_configured && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
          <p><strong>Publishable Key:</strong> {config.publishable_key ? `${config.publishable_key.slice(0, 12)}...` : 'Not set'}</p>
          <p><strong>Secret Key:</strong> ••••••••••••</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Publishable Key</label>
          </div>
          <Input
            placeholder="pk_live_... or pk_test_..."
            value={form.publishable_key}
            onChange={(e) => setForm({ ...form, publishable_key: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Secret Key</label>
          </div>
          <Input
            type="password"
            placeholder="sk_live_... or sk_test_..."
            value={form.secret_key}
            onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-500 font-medium flex items-center gap-1 hover:underline"
          >
            Get keys from Stripe <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form.secret_key && !form.publishable_key}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SendGridSection({ config }: { config: IntegrationConfig['sendgrid'] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ api_key: '', from_email: '' });
  const [testEmail, setTestEmail] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => client.put('/settings/sendgrid', form).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setForm({ api_key: '', from_email: '' });
      toast('success', 'SendGrid settings saved!');
    },
    onError: () => toast('error', 'Failed to save SendGrid settings'),
  });

  const testMutation = useMutation({
    mutationFn: () => client.post('/settings/sendgrid/test', { to_email: testEmail }).then((r) => r.data),
    onSuccess: () => {
      toast('success', `Test email sent to ${testEmail}`);
      setTestEmail('');
    },
    onError: (err: any) => toast('error', err.response?.data?.error || 'Failed to send test email'),
  });

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">SendGrid Email</h3>
            <p className="text-sm text-gray-500">Booking confirmations, status updates, password resets</p>
          </div>
        </div>
        <StatusIndicator configured={config.is_configured} />
      </div>

      {config.is_configured && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
          <p><strong>From Email:</strong> {config.from_email}</p>
          <p><strong>API Key:</strong> ••••••••••••</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">API Key</label>
          </div>
          <Input
            type="password"
            placeholder="SG.xxxxx..."
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">From Email (optional)</label>
          </div>
          <Input
            placeholder={config.from_email || 'brakesoncall@gmail.com'}
            value={form.from_email}
            onChange={(e) => setForm({ ...form, from_email: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://app.sendgrid.com/settings/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-500 font-medium flex items-center gap-1 hover:underline"
          >
            Get key from SendGrid <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!form.api_key}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Test Email */}
      {config.is_configured && (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Send Test Email</p>
          <div className="flex gap-2">
            <Input
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              loading={testMutation.isPending}
              disabled={!testEmail}
              size="sm"
              className="shrink-0"
            >
              <Send className="w-4 h-4" /> Test
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function TurnstileSection({ config }: { config: IntegrationConfig['turnstile'] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ site_key: '', secret_key: '' });

  const mutation = useMutation({
    mutationFn: () => client.put('/settings/turnstile', form).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setForm({ site_key: '', secret_key: '' });
      toast('success', 'Turnstile settings saved!');
    },
    onError: () => toast('error', 'Failed to save Turnstile settings'),
  });

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Cloudflare Turnstile</h3>
            <p className="text-sm text-gray-500">CAPTCHA protection on registration (free, privacy-first)</p>
          </div>
        </div>
        <StatusIndicator configured={config.is_configured} />
      </div>

      {config.is_configured && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
          <p><strong>Site Key:</strong> {config.site_key ? `${config.site_key.slice(0, 12)}...` : 'Not set'}</p>
          <p><strong>Secret Key:</strong> ••••••••••••</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Site Key</label>
          </div>
          <Input
            placeholder="0x4AAAAAAA..."
            value={form.site_key}
            onChange={(e) => setForm({ ...form, site_key: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Secret Key</label>
          </div>
          <Input
            type="password"
            placeholder="0x4AAAAAAA..."
            value={form.secret_key}
            onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://dash.cloudflare.com/?to=/:account/turnstile"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-500 font-medium flex items-center gap-1 hover:underline"
          >
            Get keys from Cloudflare <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form.site_key && !form.secret_key}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>

      {!config.is_configured && (
        <div className="bg-blue-50 rounded-xl p-3 mt-4 text-sm text-blue-700">
          CAPTCHA is optional. When not configured, registration works without bot protection.
        </div>
      )}
    </Card>
  );
}

export function SettingsPage() {
  const { data: settings, isLoading } = useQuery<IntegrationConfig>({
    queryKey: ['settings'],
    queryFn: () => client.get('/settings').then((r) => r.data),
  });

  if (isLoading || !settings) return <PageSpinner />;

  const configuredCount = [settings.stripe.is_configured, settings.sendgrid.is_configured, settings.turnstile.is_configured].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-gray-500">
          Manage your integrations and API keys. {configuredCount}/3 integrations configured.
        </p>
      </div>

      <StripeSection config={settings.stripe} />
      <SendGridSection config={settings.sendgrid} />
      <TurnstileSection config={settings.turnstile} />

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        <strong>Note:</strong> Keys are stored in server memory and will reset when the server restarts.
        For persistence, add them to your <code className="bg-yellow-100 px-1 rounded">.env</code> file.
      </div>
    </div>
  );
}
