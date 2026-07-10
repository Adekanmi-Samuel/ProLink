'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';
import { NIGERIAN_STATES } from '../../../lib/states';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    budget: '', 
    jobType: 'fixed',
    onSite: false,
    state: '',
    city: '',
    categoryId: '', 
    skillIds: [] as number[] 
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');
  const [errorType, setErrorType] = useState('');
  const [categories, setCategories] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, profileRes] = await Promise.all([
          api.get('/taxonomy/categories'),
          api.get('/profiles/me')
        ]);
        setCategories(catRes.data);
        setProfile(profileRes.data);
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!formData.categoryId) {
      setAvailableSkills([]);
      return;
    }
    const fetchSkills = async () => {
      try {
        const res = await api.get(`/taxonomy/skills?categoryId=${formData.categoryId}`);
        setAvailableSkills(res.data);
      } catch (err) {
        console.error('Failed to load skills', err);
      }
    };
    fetchSkills();
  }, [formData.categoryId]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleSkill = (skillId: number) => {
    if (formData.skillIds.includes(skillId)) {
      setFormData({ ...formData, skillIds: formData.skillIds.filter(id => id !== skillId) });
    } else {
      setFormData({ ...formData, skillIds: [...formData.skillIds, skillId] });
    }
  };

  const handleCheckboxChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setErrorMsg('');
    setErrorType('');
    setLoading(true);
    try {
      // Only include defined fields — skip null/undefined so Zod default works
      const jobData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        job_type: formData.onSite ? 'in-person' : 'digital',
        payment_type: formData.jobType,
        skillIds: formData.skillIds,
      };
      if (formData.budget) jobData.budget = parseFloat(formData.budget);
      if (formData.categoryId) jobData.category_id = parseInt(formData.categoryId);
      if (formData.onSite) {
        if (formData.state) jobData.state = formData.state;
        if (formData.city) jobData.city = formData.city;
      }
      await api.post('/jobs', jobData);
      router.push('/dashboard/my-jobs');
    } catch (error: any) {
      const errData = error.response?.data;
      const status = error.response?.status;
      let errMsg = errData?.msg || errData?.error || errData?.message || 'Failed to post job. Please try again.';
      if (errData?.errors?.length > 0) {
        errMsg = errData.errors[0].message;
      }

      // Handle verification errors from any response shape or status code
      const errMsgStr = String(errMsg || '');
      const isVerifyError = errMsgStr.toLowerCase().includes('verify') ||
        errMsgStr.toLowerCase().includes('email') ||
        String(errData?.msg || '').toLowerCase().includes('verify');

      if (isVerifyError) {
        errMsg = (
          <span>
            ⚠️ Please verify your email before posting jobs.{' '}
            <a href="/verify" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Verify now →
            </a>
          </span>
        );
        setErrorType('verify');
      } else if (status === 403 && errData?.msg?.includes('clients')) {
        errMsg = '⚠️ Only clients can post jobs. Your account is registered as a Service Provider.';
      }
      setErrorMsg(errMsg);
      console.error('[Job Post Error]', { status, errData });
    } finally {
      setLoading(false);
    }
  };

  const selectedLGAs = formData.state ? (NIGERIAN_STATES[formData.state] || []) : [];

  return (
    <motion.div
      style={{ maxWidth: 768, margin: '0 auto', padding: '2rem 1.5rem' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
    >
      <motion.div style={{ marginBottom: '2rem' }}>
        <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Client dashboard</div>
        <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--fg)' }}>Post a New Job</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.92rem', marginTop: '0.3rem' }}>Find the perfect talent for your project securely through Escrow.</p>
      </motion.div>

      {/* Email Verification Banner */}
      {profile && !profile.email_verified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--warning-bg)', border: '1.5px solid var(--warning)',
            color: 'var(--warning-text)', borderRadius: 'var(--radius)', padding: '1rem',
            fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Please verify your email address</div>
            <div style={{ opacity: 0.9 }}>You must verify your email before you can post a job on ProLink.</div>
          </div>
          <button onClick={() => router.push('/verify-email')} className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Verify Now
          </button>
        </motion.div>
      )}

      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            style={{ flex: 1, height: 6, borderRadius: 99, background: s <= step ? 'var(--accent)' : 'var(--border)' }}
            animate={{ background: s <= step ? 'var(--accent)' : 'var(--border)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <motion.div
        className="card"
        style={{ padding: '2.5rem' }}
        layout
        transition={{ duration: 0.3, ease: FAUCET_EASING }}
      >
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--danger-bg)', border: '1.5px solid var(--danger)',
              color: 'var(--danger)', borderRadius: 'var(--radius)', padding: '0.7rem 1rem',
              fontSize: '0.85rem', marginBottom: '1.5rem',
            }}
          >
            <div>
              ⚠️ {errorMsg}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* STEP 1: Basic Details */}
          <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: FAUCET_EASING }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)', marginBottom: '1.25rem' }}>Step 1: The Basics</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="field-group">
                  <label htmlFor="title" className="field-label">Job Title</label>
                  <input className="field" id="title" name="title" type="text" required
                    value={formData.title} onChange={handleChange}
                    placeholder="e.g., Logo design for a tech startup"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="categoryId" className="field-label">Category</label>
                  <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="field" required>
                    <option value="">Select a Category</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {availableSkills.length > 0 && (
                  <div className="field-group">
                    <label className="field-label">Required Skills</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      {availableSkills.map((skill: any) => {
                        const isSelected = formData.skillIds.includes(skill.id);
                        return (
                          <motion.span
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            style={{
                              padding: '0.4rem 1rem', borderRadius: 999, fontSize: '0.85rem',
                              cursor: 'pointer', border: '1px solid',
                              background: isSelected ? 'var(--accent-alpha)' : 'transparent',
                              borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                              color: isSelected ? 'var(--accent)' : 'var(--fg-secondary)',
                              fontWeight: isSelected ? 600 : 400,
                              transition: 'all 0.15s',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {skill.name}
                          </motion.span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Description & Scope */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: FAUCET_EASING }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)', marginBottom: '1.25rem' }}>Step 2: Description & Scope</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="field-group">
                  <label htmlFor="description" className="field-label">Project Description</label>
                  <textarea
                    id="description" name="description" rows={6} required
                    value={formData.description} onChange={handleChange}
                    className="field"
                    placeholder="Describe your project in detail - deliverables, timeline, expectations…"
                    style={{ resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                <div className="field-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--fg)' }}>
                    <input
                      type="checkbox"
                      name="onSite"
                      checked={formData.onSite}
                      onChange={handleCheckboxChange}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    This job requires being on-site
                  </label>
                  
                  {formData.onSite && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <div style={{ flex: 1 }} className="field-group">
                        <label htmlFor="state" className="field-label">State</label>
                        <select id="state" name="state" required={formData.onSite}
                          value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                          className="field"
                        >
                          <option value="">Select State</option>
                          {Object.keys(NIGERIAN_STATES).filter(s => s !== 'Other').map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }} className="field-group">
                        <label htmlFor="city" className="field-label">City / LGA (Optional)</label>
                        <select id="city" name="city"
                          value={formData.city} onChange={handleChange}
                          className="field"
                          disabled={!formData.state}
                        >
                          <option value="">Select LGA</option>
                          {selectedLGAs.map((lga: string) => (
                            <option key={lga} value={lga}>{lga}</option>
                          ))}
                          {selectedLGAs.length === 0 && <option value="Other">Other</option>}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Budget & Terms */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: FAUCET_EASING }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg)', marginBottom: '1.25rem' }}>Step 3: Budget & Terms</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="field-group">
                  <label className="field-label">Payment Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { value: 'fixed', title: 'Fixed Price', desc: 'Pay the entire amount into Escrow at once.' },
                      { value: 'milestone', title: 'Project Stages', desc: "Split the project into smaller parts and pay for each part as it's completed." },
                    ].map(pt => (
                      <motion.div
                        key={pt.value}
                        onClick={() => setFormData({ ...formData, jobType: pt.value })}
                        style={{
                          padding: '1.25rem',
                          border: '1.5px solid',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          borderColor: formData.jobType === pt.value ? 'var(--accent)' : 'var(--border)',
                          background: formData.jobType === pt.value ? 'var(--accent-alpha)' : 'var(--surface)',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--fg)', marginBottom: '0.25rem' }}>{pt.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--fg-secondary)' }}>{pt.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="budget" className="field-label">Total Budget (&#x20A6;)</label>
                  <input className="field" id="budget" name="budget" type="number" min="5000" required
                    value={formData.budget} onChange={handleChange}
                    placeholder="e.g., 50000"
                  />
                  <span className="field-hint" style={{ marginTop: '0.4rem' }}>Minimum budget is &#x20A6;5,000. Platform fee: 10%. Escrow ensures safe payment.</span>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            {step > 1 ? (
              <motion.button type="button" className="btn btn-surface" onClick={() => setStep(step - 1)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                ← Back
              </motion.button>
            ) : (
              <div />
            )}
            
            <motion.button type="submit" className="btn btn-accent" disabled={loading || (profile && !profile.email_verified)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              {loading ? 'Processing...' : step < 3 ? 'Continue →' : 'Publish Job'}
            </motion.button>
          </div>

        </form>
      </motion.div>
    </motion.div>
  );
}

export default withAuth(NewJobPage);
