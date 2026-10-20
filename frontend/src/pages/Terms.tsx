import LegalLayout from '../components/LegalLayout';

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="March 2026"
      prev={{ to: '/', label: 'Back to home' }}
      next={{ to: '/privacy', label: 'Privacy policy' }}
    >


          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">1. Acceptance of Terms</h2>
            <p>By accessing or using FarmLink ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. FarmLink reserves the right to update these terms at any time, and continued use of the Platform constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">2. Platform Description</h2>
            <p>FarmLink is a digital marketplace connecting local farmers with buyers (hotels, restaurants, schools, hospitals, and other organisations) in Nigeria. The Platform facilitates the posting of produce demands, farmer commitments to supply, and order management.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">3. User Accounts</h2>
            <p>To use FarmLink, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account credentials secure. You are responsible for all activity that occurs under your account.</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>You must be at least 18 years of age to register</li>
              <li>One person or entity may not maintain more than one account</li>
              <li>You must notify FarmLink immediately of any unauthorised use of your account</li>
              <li>FarmLink reserves the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">4. Farmers</h2>
            <p>Farmers using the Platform agree to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>Provide accurate information about their farm, location, and crops grown</li>
              <li>Only commit to supply quantities they can genuinely deliver</li>
              <li>Honour commitments that have been accepted by buyers in good faith</li>
              <li>Communicate proactively if supply cannot be fulfilled as committed</li>
              <li>Comply with all applicable Nigerian agricultural and food safety regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">5. Buyers</h2>
            <p>Buyers using the Platform agree to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>Post demands in good faith with genuine intention to purchase</li>
              <li>Provide accurate specifications for produce requirements</li>
              <li>Review and respond to farmer commitments in a timely manner</li>
              <li>Honour accepted commitments and complete payments as agreed</li>
              <li>Treat farmers with respect and professionalism</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-forest-400">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to circumvent Platform transactions to avoid fees</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorised access to any part of the Platform</li>
              <li>Scrape, crawl, or extract data from the Platform without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">7. Limitation of Liability</h2>
            <p>FarmLink acts as a facilitator between farmers and buyers. We do not guarantee the quality, safety, or legality of produce listed on the Platform, nor the accuracy of listings, or the ability of buyers to pay. FarmLink's liability is limited to the maximum extent permitted by applicable law.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">8. Governing Law</h2>
            <p>These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from use of the Platform shall be subject to the exclusive jurisdiction of Nigerian courts.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-gray-900">9. Contact</h2>
            <p>For questions about these terms, please contact us at <span className="text-gray-900 font-medium">legal@farmlink.ng</span></p>
          </section>
    </LegalLayout>
  );
}
