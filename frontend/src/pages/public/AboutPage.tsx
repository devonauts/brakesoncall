import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Users, MapPin, Wrench, Heart, ArrowRight } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-dark py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              About Brakes on Call
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              We're on a mission to make brake service as easy as ordering food delivery. No shop visits, no tow trucks — just expert technicians at your door.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Brakes on Call was born out of a simple frustration: why do you need to take time off work, arrange a ride, and sit in a waiting room just to get your brake pads replaced?
              </p>
              <p>
                Founded in Austin, Texas, we set out to bring professional brake service directly to our customers. Our certified mobile technicians come equipped with everything needed to perform brake services right in your driveway, parking lot, or wherever your vehicle is parked.
              </p>
              <p>
                Every service is documented step-by-step with photos, so you can see exactly what was done. We believe in complete transparency — no upselling, no surprises, just honest brake work done right.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Wrench className="w-7 h-7" />, title: 'Expert Technicians', desc: 'Our technicians are certified, background-checked, and carry years of experience in brake systems across all vehicle makes and models.' },
                { icon: <ShieldCheck className="w-7 h-7" />, title: 'Licensed & Insured', desc: 'Fully licensed and insured for your peace of mind. Every job is backed by our 12-month / 12,000-mile warranty on parts and labor.' },
                { icon: <Heart className="w-7 h-7" />, title: 'Customer First', desc: 'From online booking to photo-documented service reports, every touchpoint is designed around your convenience and trust.' },
                { icon: <MapPin className="w-7 h-7" />, title: 'We Come to You', desc: 'Home, office, or anywhere your car is parked. No towing, no drop-offs, no waiting rooms. We bring the shop to you.' },
                { icon: <Award className="w-7 h-7" />, title: 'Quality Parts', desc: 'We use premium brake pads and components that meet or exceed OEM specifications. Your safety is never compromised.' },
                { icon: <Users className="w-7 h-7" />, title: 'Transparent Pricing', desc: 'Upfront pricing with no hidden fees. You know exactly what you're paying before we start. No surprise charges, ever.' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Area */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Service Area</h2>
            <p className="text-gray-500 mb-6">
              We currently serve the Greater Austin, Texas metropolitan area including:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'Leander', 'Kyle', 'Buda', 'Lakeway', 'Bee Cave'].map((city) => (
                <span key={city} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-brand-500">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Ready to Experience the Difference?
            </h2>
            <p className="text-white/80 mb-8">
              Book your mobile brake service today. It takes less than 2 minutes.
            </p>
            <Link to="/book">
              <Button variant="secondary" size="lg">
                Book Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
