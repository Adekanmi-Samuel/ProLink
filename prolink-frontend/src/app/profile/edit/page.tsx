'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';
import { NIGERIAN_STATES } from '../../../lib/states';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  const [formData, setFormData] = useState({
    full_name: '', bio: '', profile_picture_url: '',
    title: '', hourlyRate: '', ratePeriod: 'weekly', availability: 'full_time', skillIds: [] as number[], state: '', city: '', gender: ''
  });

  const userType = profile?.user_type;
  const selectedStateLgas = formData.state && NIGERIAN_STATES[formData.state] ? NIGERIAN_STATES[formData.state] : [];

  const handleAddCustomSkill = async () => {
    if (!customSkill.trim()) return;
    try {
      const res = await api.post('/taxonomy/skills', { name: customSkill });
      const newSkill = res.data;
      setAvailableSkills((prev: any) => {
        if (!prev.find((s: any) => s.id === newSkill.id)) return [...prev, newSkill];
        return prev;
      });
      setFormData((prev) => {
        if (!prev.skillIds.includes(newSkill.id)) return { ...prev, skillIds: [...prev.skillIds, newSkill.id] };
        return prev;
      });
      setCustomSkill('');
    } catch (err) {
      console.error('Failed to add custom skill', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, skillsRes] = await Promise.all([
          api.get('/profiles/me'),
          api.get('/taxonomy/skills')
        ]);
        const data = meRes.data;
        setProfile(data);
        setAvailableSkills(skillsRes.data || []);
        let existingSkillIds: number[] = [];
        if (data.skills && Array.isArray(data.skills)) {
          existingSkillIds = data.skills.map((s: any) => s.skill_id || s.id);
        }
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          profile_picture_url: data.profile_picture_url || '',
          title: data.title || '',
          hourlyRate: data.hourly_rate ? data.hourly_rate.toString() : '',
          ratePeriod: data.rate_period || 'weekly',
          availability: data.availability || 'full_time',
          skillIds: existingSkillIds,
          state: data.state || '',
          city: data.city || '',
          gender: data.gender || ''
        });
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'state') setFormData(prev => ({ ...prev, [name]: value, city: '' }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const response = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, profile_picture_url: response.data.url }));
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');
    try {
      const payload: any = {
        full_name: formData.full_name,
        bio: formData.bio,
        profile_picture_url: formData.profile_picture_url,
        state: formData.state,
        city: formData.city,
        gender: formData.gender
      };
      if (userType === 'provider') {
        payload.title = formData.title;
        payload.hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;
        payload.ratePeriod = formData.ratePeriod;
        payload.availability = formData.availability;
        payload.skills = formData.skillIds;
      }
      await api.put('/profiles/me', payload);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  );

  const FieldLabel = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: '0.35rem' }}>{children}</label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
      style={{ maxWidth: 640, margin: '0 auto', padding: '1rem 0' }}
    >
      <motion.div className="card glass" style={{ padding: '2.5rem 2rem' }}>
        <motion.h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--fg)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Edit Profile
        </motion.h1>
        <motion.p style={{ color: 'var(--fg-tertiary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Update your personal and professional information
        </motion.p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 'var(--radius)', padding: '0.65rem 1rem', fontSize: '0.83rem', marginBottom: '1.5rem' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Avatar */}
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <motion.div
              style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid var(--accent-alpha)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface2)', fontSize: '2rem',
              }}
              whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
            >
              {formData.profile_picture_url ? (
                <img src={formData.profile_picture_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>👤</span>
              )}
            </motion.div>
            <div>
              <motion.label
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex' }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
              >
                {isUploading ? 'Uploading...' : 'Change Photo'}
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
              </motion.label>
              <p style={{ fontSize: '0.72rem', color: 'var(--fg-tertiary)', marginTop: '0.4rem' }}>Square image, max 2MB</p>
            </div>
          </motion.div>

          {/* Full Name */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
            <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} className="field" placeholder="e.g. John Doe" />
          </motion.div>

          {/* Bio + Gender */}
          <motion.div style={{ display: 'flex', gap: '1rem' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} className="field" rows={4} placeholder="Tell us about yourself..." />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel htmlFor="gender">Gender</FieldLabel>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="field">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </motion.div>

          {/* State + City */}
          <motion.div style={{ display: 'flex', gap: '1rem' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <select id="state" name="state" value={formData.state} onChange={handleChange} className="field">
                <option value="">Select State</option>
                {Object.keys(NIGERIAN_STATES).map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel htmlFor="city">LGA / City</FieldLabel>
              <select id="city" name="city" value={formData.city} onChange={handleChange} className="field" disabled={!formData.state}>
                <option value="">Select LGA</option>
                {selectedStateLgas.map((lga: string) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
                {formData.state && !selectedStateLgas.length && <option value="Other">Other</option>}
              </select>
            </div>
          </motion.div>

          {/* Provider-only fields */}
          {userType === 'provider' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <FieldLabel htmlFor="title">Professional Title</FieldLabel>
                <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="field" placeholder="e.g. Senior Full-Stack Developer" />
              </motion.div>

              <motion.div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel htmlFor="hourlyRate">Expected Rate (₦)</FieldLabel>
                  <input id="hourlyRate" name="hourlyRate" type="number" step="0.01" value={formData.hourlyRate} onChange={handleChange} className="field" placeholder="0.00" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel htmlFor="ratePeriod">Rate Period</FieldLabel>
                  <select id="ratePeriod" name="ratePeriod" value={formData.ratePeriod} onChange={handleChange} className="field">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel htmlFor="availability">Availability</FieldLabel>
                  <select id="availability" name="availability" value={formData.availability} onChange={handleChange} className="field">
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="as_needed">As Needed</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </motion.div>

              {/* Skills */}
              <motion.div style={{ marginTop: '1.5rem' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: '0.5rem' }}>Skills</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSkill(); } }}
                    className="field"
                    placeholder="Add a custom skill..."
                    style={{ flex: 1 }}
                  />
                  <motion.button type="button" onClick={handleAddCustomSkill} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
                    + Add
                  </motion.button>
                </div>
                <motion.div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  {availableSkills.map((skill: any) => {
                    const selected = formData.skillIds.includes(skill.id);
                    return (
                      <motion.label
                        key={skill.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer',
                          background: selected ? 'var(--accent-alpha)' : 'transparent',
                          padding: '0.4rem 0.8rem', borderRadius: '6px',
                          border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                        }}
                        whileHover={{ y: -1 }}
                        animate={{ background: selected ? 'var(--accent-alpha)' : 'transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) setFormData({ ...formData, skillIds: [...formData.skillIds, skill.id] });
                            else setFormData({ ...formData, skillIds: formData.skillIds.filter(id => id !== skill.id) });
                          }}
                          style={{ display: 'none' }}
                        />
                        {skill.name}
                      </motion.label>
                    );
                  })}
                  {availableSkills.length === 0 && <span style={{ color: 'var(--fg-tertiary)', fontSize: '0.85rem' }}>No skills available. Add a custom skill above.</span>}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Submit */}
          <motion.button type="submit" disabled={isUploading} className="btn btn-accent" style={{ width: '100%', padding: '0.85rem' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            {isUploading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
                Saving…
              </span>
            ) : 'Save Changes'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default withAuth(EditProfilePage);
