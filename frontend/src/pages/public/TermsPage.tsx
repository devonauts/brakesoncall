import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: March 27, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the Brakes on Call website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Services</h2>
              <p>Brakes on Call provides mobile brake repair and maintenance services. Our technicians travel to your specified location to perform brake pad replacements, inspections, and related services.</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Services are subject to availability in your area.</li>
                <li>Service times are estimates and may vary based on vehicle condition.</li>
                <li>We reserve the right to decline service if conditions are unsafe.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Booking and Cancellation</h2>
              <p>When you book a service through our platform:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>You agree to provide accurate vehicle and location information.</li>
                <li>You must be present or have an authorized representative at the service location.</li>
                <li>Cancellations made at least 24 hours before the appointment incur no charge.</li>
                <li>Late cancellations (less than 24 hours) may be subject to a cancellation fee.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Pricing and Payment</h2>
              <p>Prices displayed on our website are base prices and may vary depending on vehicle make and model. Payment is due upon completion of service. We accept credit/debit cards and cash.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Warranty</h2>
              <p>All brake pad replacements performed by Brakes on Call include a 12-month / 12,000-mile warranty covering parts and labor. This warranty does not cover damage caused by accidents, misuse, or normal wear beyond the warranty period.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Liability</h2>
              <p>Brakes on Call carries full liability insurance. Our liability is limited to the cost of the service performed. We are not responsible for pre-existing vehicle conditions, damage unrelated to our service, or indirect/consequential damages.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access. We reserve the right to suspend or terminate accounts that violate these terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Intellectual Property</h2>
              <p>All content on the Brakes on Call website, including logos, text, images, and software, is the property of Brakes on Call and is protected by copyright and trademark laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Governing Law</h2>
              <p>These terms are governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Travis County, Texas.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Contact</h2>
              <p>For questions about these Terms, contact us at:</p>
              <p className="mt-2">
                <strong>Brakes on Call</strong><br />
                Email: brakesoncall@gmail.com<br />
                Phone: (512) 630-9050<br />
                Austin, TX
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
