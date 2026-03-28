import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: March 27, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
              <p>When you use Brakes on Call, we collect information you provide directly, including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account.</li>
                <li><strong>Vehicle Information:</strong> Year, make, model, color, and license plate of vehicles you add to your account.</li>
                <li><strong>Booking Information:</strong> Service address, scheduled date and time, and service notes.</li>
                <li><strong>Payment Information:</strong> Payment method details processed securely through Stripe. We do not store your full credit card number.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Provide, maintain, and improve our mobile brake services.</li>
                <li>Process and complete service bookings and payments.</li>
                <li>Send you booking confirmations, service updates, and appointment reminders.</li>
                <li>Communicate with you about promotions, updates, and customer support.</li>
                <li>Ensure the safety and security of our platform and services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Service Technicians:</strong> Your name, phone number, vehicle details, and service address are shared with the assigned technician to complete your service.</li>
                <li><strong>Payment Processors:</strong> Stripe processes your payment information under their own privacy policy.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data, including encrypted data transmission (SSL/TLS), secure password hashing, and access controls. However, no method of electronic storage is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Access and update your personal information through your account settings.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of marketing communications.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Cookies</h2>
              <p>We use essential cookies and local storage to maintain your login session and preferences. We do not use third-party tracking cookies.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, contact us at:</p>
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
