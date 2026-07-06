import React from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function PrivacyPolicy() {
  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <section className="prose-page" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '5rem' }}>
        <h1 className="text-4xl md:text-5xl font-extrabold font-outfit text-[var(--fg)] mb-6">Privacy Policy</h1>
        <p className="text-[var(--muted)] mb-10 text-lg">Last updated: June 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-[var(--fg)]">
          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, update your profile, 
              post a job, or communicate with other users. This includes your name, email address, phone number, and location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">2. Sensitive Verification Data (NIN/BVN)</h2>
            <p className="leading-relaxed">
              ProLink takes your privacy very seriously. We only request your National Identity Number (NIN) or Bank Verification Number (BVN) 
              at the point of need (e.g., identity verification for trust or before large payouts). 
              <strong> We do not store raw NIN or BVN data.</strong> We securely transmit it to our authorized verification partners to confirm your identity, 
              and discard the sensitive number immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">3. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, securely process your payments, 
              prevent fraud, resolve disputes, and communicate with you about your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">4. Sharing Your Information</h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We may share your information with trusted third-party service providers 
              (such as payment processors like Paystack) only to the extent necessary to perform services on our behalf. 
              We may also disclose your information if required by Nigerian law or to protect our rights and the safety of our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">5. Your Rights and Choices</h2>
            <p className="leading-relaxed">
              You have the right to access, correct, or delete your personal data. You may update your account information at any time 
              by logging into your profile. If you wish to delete your account entirely, please contact our support team.
            </p>
          </section>
        </div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg-tertiary)', borderTop: '1px solid var(--border)', fontSize: '0.85rem' }}>
        <p>&copy; {new Date().getFullYear()} ProLink Nigeria. All rights reserved.</p>
      </footer>
    </div>
  );
}
