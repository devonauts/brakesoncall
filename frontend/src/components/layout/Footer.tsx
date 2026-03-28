import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/brakesoncall.png" alt="Brakes on Call" className="h-12 w-auto" />
            </div>
            <p className="text-gray-400 text-sm max-w-sm mb-4">
              Professional mobile brake service that comes to your home or office. Licensed, insured, and committed to your safety.
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <a href="tel:+15126309050" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>(512) 630-9050</span>
              </a>
              <a href="mailto:brakesoncall@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>brakesoncall@gmail.com</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Greater Austin, TX</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <Link to="/book" className="hover:text-white transition-colors">Book Now</Link>
              <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/services" className="hover:text-white transition-colors">Front Brake Pads</Link>
              <Link to="/services" className="hover:text-white transition-colors">Rear Brake Pads</Link>
              <Link to="/services" className="hover:text-white transition-colors">Full Brake Service</Link>
              <Link to="/services" className="hover:text-white transition-colors">Brake Inspection</Link>
              <Link to="/services" className="hover:text-white transition-colors">Brake Fluid Flush</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link to="/login" className="hover:text-white transition-colors">Customer Login</Link>
              <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Brakes on Call. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
