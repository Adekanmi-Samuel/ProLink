'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../lib/api';

function MockPaystackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const reference = searchParams?.get('reference') || '';
  const amount = searchParams?.get('amount') || '0';
  const email = searchParams?.get('email') || '';

  const [loading, setLoading] = useState(false);

  const simulatePayment = async (success: boolean) => {
    setLoading(true);
    if (success) {
      try {
        await api.post('/payments/mock-confirm', { reference });
        // Go back to contracts dashboard or somewhere generic
        router.push('/dashboard/contracts?payment_success=true');
      } catch (err) {
        alert('Mock payment failed to confirm via API');
        setLoading(false);
      }
    } else {
      alert('Payment cancelled.');
      router.push('/dashboard/contracts');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.logo}>Paystack (Mock Mode)</div>
          <div style={s.email}>{email}</div>
        </div>

        <div style={s.amountWrap}>
          <span style={s.currency}>NGN</span>
          <span style={s.amount}>{Number(amount).toLocaleString()}</span>
        </div>

        <div style={s.cardBody}>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            This is a mock checkout because PAYSTACK_SECRET_KEY is not set.
            Ref: {reference}
          </p>

          <button onClick={() => simulatePayment(true)} disabled={loading} style={{...s.btn, ...s.btnSuccess}}>
            {loading ? 'Processing...' : 'Simulate Successful Payment'}
          </button>
          
          <button onClick={() => simulatePayment(false)} disabled={loading} style={{...s.btn, ...s.btnCancel}}>
            Cancel Payment
          </button>
        </div>

        <div style={s.footer}>
          🔒 Secured by ProLink Mock Engine
        </div>
      </div>
    </div>
  );
}

export default function MockPaystack() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Checkout...</div>}>
      <MockPaystackContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif'
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#0ba4db',
    color: '#fff',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.1rem'
  },
  email: {
    fontSize: '0.8rem',
    opacity: 0.9
  },
  amountWrap: {
    backgroundColor: 'var(--bg2)',
    padding: '2rem',
    textAlign: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  currency: {
    fontSize: '1.2rem',
    color: 'var(--muted)',
    marginRight: '0.5rem',
    fontWeight: 'bold'
  },
  amount: {
    fontSize: '2.5rem',
    color: 'var(--fg)',
    fontWeight: 800
  },
  cardBody: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  btn: {
    padding: '1rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnSuccess: {
    backgroundColor: '#0ba4db',
    color: '#fff'
  },
  btnCancel: {
    backgroundColor: 'var(--surface2)',
    color: 'var(--fg)',
  },
  footer: {
    padding: '1rem',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--muted)',
    backgroundColor: 'var(--bg2)',
    borderTop: '1px solid var(--border)'
  }
};
