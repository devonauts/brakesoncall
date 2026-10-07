import { useCallback, useState } from 'react';
import axios from 'axios';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Turnstile } from '../../components/ui/Turnstile';
import { useToast } from '../../components/ui/Toast';
import { contactApi } from '../../api/contact';

const EMPTY_FORM = { name: '', email: '', phone: '', message: '', website: '' };

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; errors?: Record<string, string[]> } | undefined;
    if (err.response?.status === 429) return 'Too many messages. Please wait a few minutes or call us.';
    if (data?.error) return data.error;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.length) return first[0];
    }
    if (!err.response) return 'Could not reach the server. Please check your connection or call us.';
  }
  return 'Your message could not be sent. Please try again or call (512) 630-9050.';
}

export function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const onTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const onTurnstileExpire = useCallback(() => setTurnstileToken(''), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactApi.submit({ ...form, turnstile_token: turnstileToken });
      toast('success', 'Message sent! We\'ll get back to you within 24 hours.');
      setForm(EMPTY_FORM);
    } catch (err) {
      toast('error', errorMessage(err));
    } finally {
      // Turnstile tokens are single-use: render a fresh widget either way
      setTurnstileToken('');
      setTurnstileKey((k) => k + 1);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-dark py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Contact Us</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Have a question or need help? We'd love to hear from you. Reach out and we'll respond within 24 hours.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Phone</h3>
                      <p className="text-gray-500 text-sm mt-1">(512) 630-9050</p>
                      <p className="text-gray-400 text-xs mt-0.5">Mon-Sat, 7am - 7pm</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Email</h3>
                      <p className="text-gray-500 text-sm mt-1">brakesoncall@gmail.com</p>
                      <p className="text-gray-400 text-xs mt-0.5">We respond within 24 hours</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Service Area</h3>
                      <p className="text-gray-500 text-sm mt-1">Greater Austin, TX</p>
                      <p className="text-gray-400 text-xs mt-0.5">We come to your location</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Business Hours</h3>
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        <p>Monday - Friday: 7:00 AM - 7:00 PM</p>
                        <p>Saturday: 8:00 AM - 5:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Phone (optional)"
                      type="tel"
                      placeholder="(512) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                      <textarea
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        rows={5}
                        placeholder="How can we help you?"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>
                    {/* Honeypot: hidden from people, bots tend to fill it */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                      <label htmlFor="contact-website">Website</label>
                      <input
                        id="contact-website"
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                      />
                    </div>
                    <Turnstile key={turnstileKey} onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />
                    <Button type="submit" size="lg" loading={loading}>
                      Send Message
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
