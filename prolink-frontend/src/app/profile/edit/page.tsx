'use client';

import { useState, useEffect } from 'react';
import ProLinkLoader from '../../../components/ui/ProLinkLoader';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';
import { NIGERIAN_STATES } from '../../../lib/states';
import { toast } from 'sonner';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ProfileData {
  full_name: string;
  bio: string;
  profile_picture_url: string | null;
  title: string;
  hourly_rate: number | null;
  rate_period: string;
  availability: string;
  skills: { id: number; name: string }[];
  state: string;
  city: string;
  gender: string;
  user_type: string;
  email: string;
  phone_number: string | null;
}

function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'verification'>('personal');

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    profile_picture_url: '',
    title: '',
    hourlyRate: '',
    ratePeriod: 'weekly',
    availability: 'full_time',
    skillIds: [] as number[],
    state: '',
    city: '',
    gender: '',
  });

  const isProvider = profile?.user_type === 'provider';
  const lgList = form.state && NIGERIAN_STATES[form.state] ? NIGERIAN_STATES[form.state] : [];

  // Make sure lgList is always an array
  const lgas: string[] = Array.isArray(lgList) ? lgList : [];

  // ── Load Data ──
  useEffect(() => {
    (async () => {
      try {
        const [meRes, skillsRes] = await Promise.all([
          api.get('/profiles/me'),
          api.get('/taxonomy/skills'),
        ]);
        const d = meRes.data;
        setProfile(d);
        setAvailableSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
        const existingSkillIds: number[] = Array.isArray(d.skills)
          ? d.skills.map((s: any) => s.id)
          : [];
        setForm({
          full_name: d.full_name || '',
          bio: d.bio || '',
          profile_picture_url: d.profile_picture_url || '',
          title: d.title || '',
          hourlyRate: d.hourly_rate ? String(d.hourly_rate) : '',
          ratePeriod: d.rate_period || 'weekly',
          availability: d.availability || 'full_time',
          skillIds: existingSkillIds,
          state: d.state || '',
          city: d.city || '',
          gender: d.gender || '',
        });
      } catch (err: any) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Handlers ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'state') setForm(prev => ({ ...prev, state: value, city: '' }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url || res.data.secure_url;
      if (url) setForm(prev => ({ ...prev, profile_picture_url: url }));
      toast.success('Photo uploaded');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddSkill = async () => {
    if (!customSkill.trim()) return;
    try {
      const res = await api.post('/taxonomy/skills', { name: customSkill.trim() });
      const s = res.data;
      setAvailableSkills(prev => (prev.find(x => x.id === s.id) ? prev : [...prev, s]));
      setForm(prev => (prev.skillIds.includes(s.id) ? prev : { ...prev, skillIds: [...prev.skillIds, s.id] }));
      setCustomSkill('');
    } catch {
      toast.error('Failed to add skill');
    }
  };

  const toggleSkill = (id: number) => {
    setForm(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(id)
        ? prev.skillIds.filter(x => x !== id)
        : [...prev.skillIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build payload — only include defined fields
      const payload: Record<string, any> = {
        full_name: form.full_name || undefined,
        bio: form.bio || undefined,
        state: form.state || undefined,
        city: form.city || undefined,
      };

      // Only include profile_picture_url if an image is actually uploaded
      if (form.profile_picture_url && form.profile_picture_url !== '') {
        payload.profile_picture_url = form.profile_picture_url;
      }

      if (form.gender && form.gender !== '') {
        payload.gender = form.gender;
      }

      if (isProvider) {
        payload.title = form.title || undefined;
        payload.hourlyRate = form.hourlyRate ? parseFloat(form.hourlyRate) : undefined;
        payload.ratePeriod = form.ratePeriod;
        payload.availability = form.availability;
        if (form.skillIds.length > 0) {
          payload.skills = form.skillIds;
        }
      }

      await api.put('/profiles/me', payload);
      toast.success('Profile saved!');
      router.push('/profile');
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="page" style={{ paddingTop: '80px' }}>
        <ProLinkLoader />
      </div>
    );
  }

  // ── Tab switcher ──
  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '0.6rem 1.2rem',
        borderRadius: 999,
        border: 'none',
        background: activeTab === id ? 'var(--accent)' : 'var(--surface)',
        color: activeTab === id ? '#fff' : 'var(--fg-secondary)',
        fontWeight: 600,
        fontSize: '0.82rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="page">
      <style>{`
        @media (max-width: 600px) {
          .profile-row { flex-direction: column !important; grid-template-columns: 1fr !important; }
          .profile-row-3 { flex-direction: column !important; grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'calc(var(--navbar-h) + 1.5rem) 1rem 3rem',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Edit Profile
          </h1>
          <p style={{ color: 'var(--fg-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Keep your profile up to date to attract the right opportunities.
          </p>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Tab id="personal" label="Personal" />
          <Tab id="professional" label="Professional" />
          {isProvider && <Tab id="verification" label="Verification" />}
        </div>

        <form onSubmit={handleSubmit}>
          {/* ════════════════════════════════════════════
              TAB 1 — PERSONAL
          ════════════════════════════════════════════ */}
          {activeTab === 'personal' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="card-base" style={{ padding: '1.5rem' }}>
                {/* Photo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid var(--border)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--surface-hover)',
                      fontSize: '2rem',
                    }}
                  >
                    {form.profile_picture_url ? (
                      <img src={form.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div>
                    <label style={{ cursor: 'pointer', display: 'inline-flex' }} className="btn btn-outline btn-sm">
                      {uploadingPhoto ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          Uploading...
                        </span>
                      ) : (
                        'Change Photo'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p style={{ fontSize: '0.72rem', color: 'var(--fg-tertiary)', marginTop: '0.3rem' }}>
                      Square image, max 2MB
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Full Name */}
                  <div className="field-group">
                    <label className="field-label" htmlFor="full_name">Full Name</label>
                    <input id="full_name" name="full_name" type="text" value={form.full_name} onChange={handleChange} className="field" placeholder="Your full name" />
                  </div>

                  {/* State + City */}
                  <div className="profile-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="field-group">
                      <label className="field-label" htmlFor="state">State</label>
                      <select id="state" name="state" value={form.state} onChange={handleChange} className="field">
                        <option value="">Select State</option>
                        {Object.keys(NIGERIAN_STATES).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="city">LGA / City</label>
                      <select id="city" name="city" value={form.city} onChange={handleChange} className="field" disabled={!form.state}>
                        <option value="">Select LGA</option>
                        {lgas.map(lga => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                        {form.state && lgas.length === 0 && <option value="Other">Other</option>}
                      </select>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="field-group">
                    <label className="field-label" htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="field">
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              TAB 2 — PROFESSIONAL
          ════════════════════════════════════════════ */}
          {activeTab === 'professional' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="card-base" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Title (providers only) */}
                  {isProvider && (
                    <div className="field-group">
                      <label className="field-label" htmlFor="title">Professional Title</label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        className="field"
                        placeholder="e.g. Senior Full-Stack Developer"
                      />
                    </div>
                  )}

                  {/* Bio */}
                  <div className="field-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="field-label" htmlFor="bio" style={{ marginBottom: 0 }}>Bio</label>
                      <button 
                        type="button" 
                        onClick={handleOptimizeProfile} 
                        disabled={aiOptimizing}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      >
                        {aiOptimizing ? 'Optimizing...' : '✨ Optimize with AI'}
                      </button>
                    </div>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={form.bio}
                      onChange={handleChange}
                      className="field"
                      placeholder="Tell clients about yourself, your experience, and what you can deliver..."
                      style={{ minHeight: 120, resize: 'vertical' }}
                    />
                  </div>

                  {/* Provider-only fields */}
                  {isProvider && (
                    <>
                      {/* Rate + Period + Availability */}
                      <div className="profile-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="field-group">
                          <label className="field-label" htmlFor="hourlyRate">Expected Rate (₦)</label>
                          <input
                            id="hourlyRate"
                            name="hourlyRate"
                            type="number"
                            step="0.01"
                            value={form.hourlyRate}
                            onChange={handleChange}
                            className="field"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="field-group">
                          <label className="field-label" htmlFor="ratePeriod">Per</label>
                          <select id="ratePeriod" name="ratePeriod" value={form.ratePeriod} onChange={handleChange} className="field">
                            <option value="hourly">Hour</option>
                            <option value="daily">Day</option>
                            <option value="weekly">Week</option>
                            <option value="monthly">Month</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                        <div className="field-group">
                          <label className="field-label" htmlFor="availability">Availability</label>
                          <select id="availability" name="availability" value={form.availability} onChange={handleChange} className="field">
                            <option value="full_time">Full-Time</option>
                            <option value="part_time">Part-Time</option>
                            <option value="as_needed">As Needed</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="field-group">
                        <label className="field-label">Skills</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={customSkill}
                            onChange={e => setCustomSkill(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                            className="field"
                            placeholder="Add a custom skill..."
                            style={{ flex: 1 }}
                          />
                          <button type="button" onClick={handleAddSkill} className="btn btn-outline">
                            + Add
                          </button>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            padding: '1rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            maxHeight: 220,
                            overflowY: 'auto',
                            marginTop: '0.5rem',
                          }}
                        >
                          {availableSkills.map(skill => {
                            const sel = form.skillIds.includes(skill.id);
                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleSkill(skill.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  background: sel ? 'var(--accent)' : 'transparent',
                                  color: sel ? '#fff' : 'var(--fg)',
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: sel ? '1px solid var(--accent)' : '1px solid var(--border)',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {skill.name}
                              </button>
                            );
                          })}
                          {availableSkills.length === 0 && (
                            <span style={{ color: 'var(--fg-tertiary)', fontSize: '0.82rem' }}>
                              No skills yet. Add one above.
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════
              TAB 3 — VERIFICATION (provider only)
          ════════════════════════════════════════════ */}
          {activeTab === 'verification' && isProvider && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="card-base" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--fg-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Verifying your identity increases trust and helps you win more jobs.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <VerifiedRow label="Email" status={profile?.email ? 'verified' : 'unverified'} />
                  <VerifiedRow label="NIN" status={profile?.nin_status || 'none'} />
                  <VerifiedRow label="CAC / Business" status={profile?.cac_status || 'none'} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SAVE BUTTON ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
            <button type="button" onClick={() => router.back()} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-accent" style={{ padding: '0.75rem 2rem' }}>
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Verification status row ── */
function VerifiedRow({ label, status }: { label: string; status: string }) {
  const colorMap: Record<string, string> = {
    verified: 'var(--success)',
    pending: 'var(--warning)',
    none: 'var(--fg-tertiary)',
    unverified: 'var(--fg-tertiary)',
  };
  const labelMap: Record<string, string> = {
    verified: 'Verified',
    pending: 'Pending Review',
    none: 'Not Submitted',
    unverified: 'Not Verified',
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: colorMap[status] || 'var(--fg-tertiary)' }}>
        {labelMap[status] || status}
      </span>
    </div>
  );
}

export default withAuth(EditProfilePage);
