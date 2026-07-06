import React from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function DisputePolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <section className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-extrabold font-outfit text-[var(--fg)] mb-6">Dispute Policy</h1>
        <p className="text-[var(--muted)] mb-10 text-lg">Last updated: June 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-[var(--fg)]">
          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">1. What is a Dispute?</h2>
            <p className="leading-relaxed">
              A dispute occurs when a Client and a Freelancer cannot agree on the release of funds held in Escrow for a specific milestone. 
              This typically happens if the Client feels the submitted deliverables do not meet the agreed-upon requirements, or if the Freelancer 
              feels they have completed the work but the Client is unresponsive or refusing to release payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">2. How to Raise a Dispute</h2>
            <p className="leading-relaxed">
              Either party can raise a dispute directly from the Job Assignment dashboard. When raising a dispute, you will be prompted to provide 
              a clear reason and any supporting context. Once raised, the milestone funds are locked and cannot be released or refunded until the dispute is resolved.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">3. The Review Process</h2>
            <p className="leading-relaxed">
              Upon receiving a dispute, our moderation team will step in to mediate. We adhere to a strict resolution timeframe:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-[var(--muted)]">
              <li><strong>Initial Review:</strong> A ProLink moderator will begin reviewing the dispute within <strong>48 hours</strong> of it being raised.</li>
              <li><strong>Evidence Gathering:</strong> Moderators will exclusively use on-platform chat logs, submitted deliverables, and the original job requirements to evaluate the claim. Communication occurring outside the platform will not be considered.</li>
              <li><strong>Mediation:</strong> The moderator may reach out to both parties via the dispute thread to request clarification or encourage an amicable settlement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-outfit mb-4 text-[var(--primary)]">4. Resolution</h2>
            <p className="leading-relaxed">
              If the parties cannot reach a mutual agreement, the ProLink moderator will make a final, binding decision. Funds will then be released 
              in full to the Client, in full to the Freelancer, or split between the two parties, depending on the findings. 
              By using our platform, you agree that decisions made by ProLink moderators during dispute resolution are final and binding.
            </p>
          </section>
        </div>
      </section>

      <footer className="py-8 text-center text-[var(--muted)] border-t border-[var(--border)]">
        <p>&copy; {new Date().getFullYear()} ProLink Nigeria. All rights reserved.</p>
      </footer>
    </div>
  );
}
