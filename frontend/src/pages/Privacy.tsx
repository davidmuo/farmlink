import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="March 2026"
      prev={{ to: '/terms', label: 'Terms of service' }}
      next={{ to: '/', label: 'Back to home' }}
    >


          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">1. Overview</h2>
            <p>FarmLink ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect information about you when you use our Platform. By using FarmLink, you consent to the data practices described in this policy.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li><strong className="text-gray-800">Account information:</strong> name, email address, phone number, and password</li>
              <li><strong className="text-gray-800">Profile information:</strong> for farmers: farm location, farm size, crops grown; for buyers: business name and type</li>
              <li><strong className="text-gray-800">Transaction data:</strong> demand postings, commitments, accepted orders, and communication between users</li>
              <li><strong className="text-gray-800">Usage data:</strong> pages visited, features used, time spent, and device/browser information</li>
              <li><strong className="text-gray-800">Communications:</strong> messages you send through the Platform or to our support team</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>Provide, operate, and improve the FarmLink Platform</li>
              <li>Facilitate connections between farmers and buyers</li>
              <li>Send transactional notifications (order updates, new commitments)</li>
              <li>Provide customer support and respond to enquiries</li>
              <li>Detect and prevent fraud or abuse of the Platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">4. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only in the following circumstances:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li><strong className="text-gray-800">With counterparties:</strong> Farmer profile details (name, location, crops) are visible to buyers reviewing commitments, and vice versa</li>
              <li><strong className="text-gray-800">Service providers:</strong> We use trusted third-party services (hosting, SMS, analytics) who process data on our behalf under strict confidentiality agreements</li>
              <li><strong className="text-gray-800">Legal requirements:</strong> We may disclose information when required by law or to protect rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">5. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted storage, secure HTTPS connections, and access controls. However, no internet transmission is completely secure, and we cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of non-essential communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <span className="text-gray-900 font-medium">privacy@farmlink.ng</span></p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">7. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal compliance purposes.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">8. Cookies</h2>
            <p>We use session cookies to maintain your logged-in state and essential cookies for Platform functionality. We do not use third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us at <span className="text-gray-900 font-medium">privacy@farmlink.ng</span></p>
          </section>
    </LegalLayout>
  );
}
