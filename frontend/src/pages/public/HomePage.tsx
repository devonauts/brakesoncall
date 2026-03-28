import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Truck,
  ShieldCheck,
  Star,
  Clock,
  Award,
  CheckCircle,
  Play,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section — Full-screen video background */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/brakesoncall.png"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-semibold">Now Serving Austin, TX</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Brake Service<br />
              That{' '}
              <span className="text-brand-500 drop-shadow-[0_0_30px_rgba(255,107,0,0.4)]">
                Comes to You.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
              Professional mobile brake service at your home or office.
              No tow trucks. No waiting rooms. Just expert service, wherever you are.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book">
                <Button size="lg" className="text-base px-10 py-4 shadow-xl shadow-brand-500/25">
                  Book Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="ghost" size="lg" className="text-white border border-white/20 hover:bg-white/10 backdrop-blur-sm">
                  View Services
                </Button>
              </Link>
            </div>

            {/* Social proof bar */}
            <div className="flex items-center gap-6 mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-white/60 text-sm">
                Rated <strong className="text-white">4.9/5</strong> from 500+ customers
              </span>
              <div className="hidden sm:block w-px h-6 bg-white/20" />
              <span className="hidden sm:block text-white/60 text-sm">
                <strong className="text-white">1,200+</strong> brake jobs completed
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Getting your brakes serviced has never been easier. Three simple steps and you're done.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <CalendarCheck className="w-8 h-8" />,
                step: '01',
                title: 'Book Online',
                desc: 'Pick your service, choose a time that works, and enter your location. It takes less than 2 minutes.',
              },
              {
                icon: <Truck className="w-8 h-8" />,
                step: '02',
                title: 'We Come to You',
                desc: 'Our certified technician arrives at your door with everything needed. No drop-offs, no rides needed.',
              },
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                step: '03',
                title: 'Drive Safe',
                desc: 'Your brakes are done right, with photos of every step. Full warranty included on all services.',
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-5xl font-extrabold text-gray-100 absolute top-6 right-8">{item.step}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Professional brake services at competitive prices, delivered to your location.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Front Brake Pads', price: 149.99, time: '~1 hour', popular: false },
              { name: 'Full Brake Service', price: 279.99, time: '~2 hours', popular: true },
              { name: 'Brake Inspection', price: 49.99, time: '~30 min', popular: false },
            ].map((svc) => (
              <div
                key={svc.name}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all hover:shadow-lg ${
                  svc.popular ? 'border-brand-500 shadow-md' : 'border-gray-200'
                }`}
              >
                {svc.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{svc.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-brand-500">${svc.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                  <Clock className="w-4 h-4" />
                  {svc.time}
                </div>
                <ul className="space-y-2 mb-8">
                  {['Professional installation', 'Quality brake pads', 'Full inspection', 'Photo documentation'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/book">
                  <Button variant={svc.popular ? 'primary' : 'outline'} fullWidth>
                    Book This Service
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services" className="text-brand-500 font-semibold hover:underline">
              View all services &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <ShieldCheck className="w-8 h-8 text-brand-500" />, label: 'Licensed & Insured' },
              { icon: <Clock className="w-8 h-8 text-brand-500" />, label: 'Same-Day Available' },
              { icon: <Award className="w-8 h-8 text-brand-500" />, label: '12-Month Warranty' },
              { icon: <Star className="w-8 h-8 text-brand-500" />, label: '4.9 Star Rating' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-3">
                {item.icon}
                <span className="font-semibold text-gray-900 text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Get Your Brakes Fixed?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
            Book your mobile brake service in under 2 minutes. We'll come to you.
          </p>
          <Link to="/book">
            <Button variant="secondary" size="lg">
              Book Your Service Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
