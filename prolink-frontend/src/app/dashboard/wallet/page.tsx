'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';
import { toast } from 'sonner';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

function WalletPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    if (bankForm.account_number.length === 10 && bankForm.bank_code) {
      setIsResolving(true);
      setResolveError('');
      api.get(`/payments/resolve-bank?account_number=${bankForm.account_number}&bank_code=${bankForm.bank_code}`)
        .then(res => {
          setBankForm(prev => ({ ...prev, account_name: res.data.account_name }));
        })
        .catch(err => {
          console.error('Failed to resolve account:', err);
          setResolveError('Could not verify this account number. Please check the details.');
          setBankForm(prev => ({ ...prev, account_name: '' }));
        })
        .finally(() => {
          setIsResolving(false);
        });
    } else {
      setResolveError('');
      setBankForm(prev => ({ ...prev, account_name: '' }));
    }
  }, [bankForm.account_number, bankForm.bank_code]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, bankRes] = await Promise.all([
          api.get('/profiles/me'),
          api.get('/profiles/me/bank').catch(() => ({ data: null }))
        ]);
        setProfile(profileRes.data);
        
        if (bankRes.data && Object.keys(bankRes.data).length > 0) {
          setBankAccount(bankRes.data);
          setBankForm({
            bank_name: bankRes.data.bank_name,
            bank_code: bankRes.data.bank_code,
            account_number: bankRes.data.account_number,
            account_name: bankRes.data.account_name
          });
        }

        if (profileRes.data.user_type === 'provider') {
          const earnRes = await api.get('/profiles/me/earnings');
          setEarnings(earnRes.data);
        }
      } catch (error) {
        console.error('Failed to load wallet data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await api.post('/profiles/me/bank', bankForm);
      setBankAccount(res.data.bankAccount);
      setIsEditingBank(false);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || err.response?.data?.error || 'Failed to save bank details.');
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
        }}
      />
    </div>;
  }

  const isProvider = profile?.user_type === 'provider';

  return (
    <motion.div
      className="wallet-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
    >
      <div className="wallet-header">
        <h1 className="wallet-header__title">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >💳 Wallet & Earnings</motion.span>
        </h1>
        <motion.p
          className="wallet-header__sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >Manage your payments and bank details securely.</motion.p>
      </div>

      <div className="wallet-grid">
        <motion.div
          className="wallet-main"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: FAUCET_EASING }}
        >
          {isProvider ? (
            <>
              <motion.div
                className="pl-card earnings-card"
                whileHover={{ y: -2, boxShadow: '0 8px 30px var(--accent-alpha)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="earnings-card__main">
                  <span className="earnings-card__label">Available for Withdrawal (Net)</span>
                  <motion.h2
                    className="earnings-card__value"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  >₦{Number(earnings?.net_payout || 0).toLocaleString()}</motion.h2>
                  <p className="earnings-card__gross">Gross Earned: ₦{Number(earnings?.gross_earned || 0).toLocaleString()} (Fee: ₦{Number(earnings?.platform_fee || 0).toLocaleString()})</p>
                </div>
                <div className="earnings-card__action">
                  <motion.button
                    className="pl-btn pl-btn-primary"
                    disabled={true}
                    style={{ opacity: 0.8 }}
                  >Payouts are Automatic</motion.button>
                  {(!bankAccount && earnings?.net_payout > 0) && (
                    <motion.p
                      className="wallet-alert-text"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >Add bank details first.</motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="pl-card wallet-card-mb"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, ease: FAUCET_EASING }}
                whileHover={{ y: -1 }}
              >
                <h3 className="wallet-card-title">Pending Escrow</h3>
                <p className="wallet-sub-text">Funds currently held in milestone escrow (funded or submitted, awaiting client approval).</p>
                <motion.div
                  className="wallet-pending-amount"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >₦{Number(earnings?.pending_escrow || 0).toLocaleString()}</motion.div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="pl-card wallet-card-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="wallet-section-heading">Client Billing</h2>
              <p className="wallet-sub-text wallet-sub-text--mb">
                As a client, your payments are handled directly per milestone. You don&apos;t need to maintain a platform balance.
              </p>
              <motion.button
                className="pl-btn pl-btn-secondary"
                onClick={() => router.push('/dashboard/contracts')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
              >Manage Contracts</motion.button>
            </motion.div>
          )}

          <div className="pl-card wallet-card-pad">
            <h3 className="wallet-card-title wallet-card-title--mb">Transaction History</h3>
            <p className="wallet-sub-text-italic">Recent transactions will appear here.</p>
          </div>
        </motion.div>

        {/* Right Column: Bank Details */}
        <motion.div
          className="wallet-sidebar"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: FAUCET_EASING }}
        >
          <motion.div className="pl-card" style={{ padding: '1.5rem' }} whileHover={{ y: -2 }}>
            <div className="wallet-header-row">
              <h3 className="wallet-card-title">Bank Details</h3>
              {bankAccount && !isEditingBank && (
                <motion.button
                  onClick={() => setIsEditingBank(true)}
                  className="wallet-edit-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >Edit</motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {(!bankAccount || isEditingBank) ? (
                <motion.form
                  key="form"
                  onSubmit={handleSaveBank}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: FAUCET_EASING }}
                >
                  <div className="pl-input-group">
                    <label>Bank Name</label>
                    <select
                      className="pl-input"
                      required
                      value={bankForm.bank_name}
                      onChange={e => {
                        setBankForm({
                          ...bankForm, 
                          bank_name: e.target.value, 
                          bank_code: e.target.options[e.target.selectedIndex].getAttribute('data-code') || '',
                          account_number: '',
                          account_name: ''
                        });
                        setResolveError('');
                      }}
                    >
                      <option value="">Select a Bank...</option>
                      <option value="Access Bank" data-code="044">Access Bank</option>
                      <option value="Guaranty Trust Bank" data-code="058">Guaranty Trust Bank (GTB)</option>
                      <option value="Zenith Bank" data-code="057">Zenith Bank</option>
                      <option value="United Bank for Africa" data-code="033">United Bank for Africa (UBA)</option>
                      <option value="First Bank of Nigeria" data-code="011">First Bank of Nigeria</option>
                      <option value="Kuda Bank" data-code="50211">Kuda Bank</option>
                      <option value="Moniepoint" data-code="50515">Moniepoint</option>
                      <option value="Opay" data-code="999992">Opay</option>
                    </select>
                  </div>
                  <div className="pl-input-group">
                    <label>Account Number</label>
                    <input type="text" className="pl-input" required maxLength={10} placeholder="e.g. 0123456789" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} />
                  </div>
                  <div className="pl-input-group wallet-input-group">
                    <label>Account Name</label>
                    <input type="text" className="pl-input" required readOnly={true} placeholder={isResolving ? "Resolving account name..." : "Auto-filled after entering account number"} value={bankForm.account_name} onChange={e => setBankForm({...bankForm, account_name: e.target.value})} style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', borderColor: resolveError ? 'var(--danger)' : undefined }} />
                    {resolveError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{resolveError}</span>}
                  </div>
                  <div className="wallet-btn-row">
                    {bankAccount && (
                      <button type="button" onClick={() => setIsEditingBank(false)} className="pl-btn pl-btn-secondary wallet-flex-btn">Cancel</button>
                    )}
                    <motion.button type="submit" disabled={savingBank} className="pl-btn pl-btn-primary wallet-flex-btn" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                      {savingBank ? 'Saving...' : 'Save Details'}
                    </motion.button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="display"
                  className="bank-display"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="bank-display__row">
                    <span className="bank-display__label">Bank</span>
                    <span className="bank-display__val">{bankAccount.bank_name}</span>
                  </div>
                  <div className="bank-display__row">
                    <span className="bank-display__label">Account No</span>
                    <span className="bank-display__val">{bankAccount.account_number}</span>
                  </div>
                  <div className="bank-display__row">
                    <span className="bank-display__label">Account Name</span>
                    <span className="bank-display__val">{bankAccount.account_name}</span>
                  </div>
                  <motion.div
                    className="wallet-success-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >✓ Ready for payouts</motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .wallet-page { max-width: 1000px; }
        .wallet-header { margin-bottom: 2rem; }
        .wallet-header__title { font-family: var(--font-heading), sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--fg); }
        .wallet-header__sub { color: var(--fg-tertiary); margin-top: 0.25rem; }
        .wallet-grid { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; align-items: flex-start; }
        .earnings-card { padding: 2rem; background: linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%); display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border: 1px solid var(--border); border-radius: var(--radius); }
        .earnings-card__label { display: block; font-size: 0.85rem; color: var(--fg-tertiary); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .earnings-card__value { font-family: var(--font-heading), sans-serif; font-size: 2.5rem; font-weight: 800; color: var(--success); line-height: 1; margin-bottom: 0.5rem; }
        .earnings-card__gross { font-size: 0.82rem; color: var(--fg-tertiary); }
        .earnings-card__action { display: flex; flex-direction: column; align-items: center; }
        .pl-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
        .pl-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.2rem; border-radius: var(--radius); font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer; font-family: inherit; }
        .pl-btn-primary { background: var(--accent); color: var(--bg); }
        .pl-btn-secondary { background: transparent; border: 1.5px solid var(--border); color: var(--fg); }
        .pl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .wallet-alert-text { font-size: 0.78rem; color: var(--danger); margin-top: 0.5rem; }
        .wallet-card-mb { margin-bottom: 1.5rem; }
        .wallet-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--fg); }
        .wallet-sub-text { font-size: 0.85rem; color: var(--fg-tertiary); }
        .wallet-pending-amount { font-family: var(--font-heading), sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--accent); margin-top: 0.75rem; }
        .wallet-card-center { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 2rem; margin-bottom: 2rem; }
        .wallet-section-heading { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--fg); }
        .wallet-card-pad { padding: 1.5rem; margin-bottom: 1.5rem; }
        .wallet-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .wallet-edit-btn { background: none; border: none; color: var(--accent); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .pl-input-group { margin-bottom: 1rem; }
        .pl-input-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--fg-secondary); margin-bottom: 0.3rem; }
        .pl-input { width: 100%; padding: 0.6rem 0.75rem; border-radius: var(--radius-sm, 8px); border: 1.5px solid var(--border); background: var(--bg); color: var(--fg); font-family: inherit; font-size: 0.85rem; }
        .pl-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-alpha); }
        .wallet-btn-row { display: flex; gap: 0.75rem; margin-top: 1.25rem; }
        .wallet-flex-btn { flex: 1; }
        .bank-display { display: flex; flex-direction: column; gap: 1rem; }
        .bank-display__row { display: flex; flex-direction: column; gap: 0.2rem; }
        .bank-display__label { font-size: 0.72rem; color: var(--fg-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .bank-display__val { font-size: 1rem; color: var(--fg); font-weight: 600; }
        .wallet-success-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(34,197,94,0.12); color: #22c55e; padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; width: fit-content; }
        @media (max-width: 768px) {
          .wallet-grid { grid-template-columns: 1fr; }
          .earnings-card { flex-direction: column; text-align: center; gap: 1.5rem; padding: 1.25rem; }
          .earnings-card__value { font-size: 2rem; }
          .wallet-btn-row { flex-direction: column; }
          .wallet-flex-btn { width: 100%; }
        }
        @media (max-width: 480px) {
          .wallet-header__title { font-size: 1.35rem; }
          .earnings-card__value { font-size: 1.75rem; }
        }
      `}</style>
    </motion.div>
  );
}

export default withAuth(WalletPage);
