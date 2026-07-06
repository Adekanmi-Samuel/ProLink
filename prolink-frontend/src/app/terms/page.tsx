import React from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function TermsOfService() {
  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <section className="prose-page" style={{ flex: 1, paddingTop: '3rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--fg)', marginBottom: '1rem', letterSpacing: '-0.025em' }}>Terms of Service</h1>
        <p style={{ color: 'var(--fg-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Last updated: June 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--fg)' }}>
          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              By accessing or using the ProLink platform, you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, you may not access the service. ProLink is a Nigerian 
              freelance marketplace designed to connect clients with talent securely.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>2. Prohibited Conduct (Anti-Disintermediation)</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              <strong style={{ color: 'var(--fg)' }}>Crucial Policy:</strong> To ensure the security, dispute protection, and trust of our platform, 
              all payments and communications must occur on-platform until a formal Job Assignment is created.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--fg-tertiary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              <li>Users are prohibited from requesting or sharing external contact information (emails, phone numbers, WhatsApp, etc.) prior to an active contract.</li>
              <li>Attempting to pay or receive payment outside of the ProLink Escrow system will result in immediate account suspension.</li>
              <li>Our chat system automatically filters contact information when no active contract exists between users.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>3. Payments and Escrow</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              ProLink acts as a secure intermediary. Clients fund milestones into an Escrow account through our payment provider (Paystack). Funds are only 
              released to the Provider when the Client approves the submitted work or upon successful resolution of a dispute. All payments must be processed through ProLink.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>4. Platform Fees</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              ProLink charges a platform fee on completed milestones to maintain our Escrow services, dispute resolution, and platform infrastructure. 
              The fee structure is clearly displayed before any job assignment is finalized. Any attempt to bypass these fees by circumventing the platform 
              will result in permanent account suspension.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>5. Account Verification and Data Handling</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              To build a trusted marketplace for Nigeria, users may be required to verify their identity via NIN 
              (National Identity Number) or BVN (Bank Verification Number) before withdrawing funds or posting large jobs.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--fg-tertiary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              <li><strong style={{ color: 'var(--fg)' }}>Point of Need:</strong> We only collect verification data when strictly necessary (e.g., prior to a large payout).</li>
              <li><strong style={{ color: 'var(--fg)' }}>Never Stored Raw:</strong> ProLink does not store raw NIN or BVN data. We securely pass it to our licensed verification partner, receive a pass/fail confirmation, and discard the sensitive number immediately.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>6. Dispute Process</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              If a disagreement arises over a funded milestone, either party can raise a dispute. ProLink moderators will step in to review chat logs, 
              submitted deliverables, and agreed-upon requirements. We aim to review all disputes within 48 hours. Decisions made by ProLink moderators are final.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: `var(--font-heading), sans-serif`, fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.75rem' }}>7. Termination</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--fg-secondary)' }}>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any 
              reason whatsoever, including without limitation if you breach the Terms.
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
