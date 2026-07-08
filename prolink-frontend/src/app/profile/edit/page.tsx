'use client';

import { useState, useEffect } from 'react';
import { Camera, Save, ArrowLeft, Trash2, X, Plus } from 'lucide-react';
import ProLinkLoader from '../../../components/ui/ProLinkLoader';
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
        fullName: formData.full_name,
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
        payload.skillIds = formData.skillIds;
      }
      await api.put('/profiles/me', payload);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ paddingTop: '80px', minHeight: '60vh' }}>
        <ProLinkLoader />
      </div>
    );
  } return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: '100px', paddingBottom: '3rem' }}>
        <div className="profile-edit-layout">
          <aside className="profile-edit-sidebar">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '1rem' }}>Settings</h3>
            <div className="profile-edit-nav-item" style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>Public Profile</div>
            <div className="profile-edit-nav-item">Account Security</div>
            <div className="profile-edit-nav-item">Notifications</div>
            <div className="profile-edit-nav-item">Payment Methods</div>
          </aside>

          <div className="profile-edit-main">
            <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="pl-alert pl-alert-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="profile-edit-section">
                <h2 className="profile-edit-section-title">Personal Information</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid var(--border)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--surface2)', fontSize: '2rem',
                  }}>
                    {formData.profile_picture_url ? (
                      <img src={formData.profile_picture_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                    </label>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: '0.4rem' }}>Square image, max 2MB</p>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="full_name">Full Name</label>
                  <input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} className="field" placeholder="e.g. John Doe" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="state">State</label>
                    <select id="state" name="state" value={formData.state} onChange={handleChange} className="field">
                      <option value="">Select State</option>
                      {Object.keys(NIGERIAN_STATES).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="city">LGA / City</label>
                    <select id="city" name="city" value={formData.city} onChange={handleChange} className="field" disabled={!formData.state}>
                      <option value="">Select LGA</option>
                      {selectedStateLgas.map((lga: string) => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                      {formData.state && !selectedStateLgas.length && <option value="Other">Other</option>}
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-edit-section">
                <h2 className="profile-edit-section-title">Professional Details</h2>
                
                {userType === 'provider' && (
                  <div className="field-group">
                    <label className="field-label" htmlFor="title">Professional Title</label>
                    <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="field" placeholder="e.g. Senior Full-Stack Developer" />
                  </div>
                )}

                <div className="field-group">
                  <label className="field-label" htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} className="field" rows={4} placeholder="Tell us about yourself..." />
                </div>

                {userType === 'provider' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <div className="field-group">
                      <label className="field-label" htmlFor="hourlyRate">Expected Rate (₦)</label>
                      <input id="hourlyRate" name="hourlyRate" type="number" step="0.01" value={formData.hourlyRate} onChange={handleChange} className="field" placeholder="0.00" />
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="ratePeriod">Rate Period</label>
                      <select id="ratePeriod" name="ratePeriod" value={formData.ratePeriod} onChange={handleChange} className="field">
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="availability">Availability</label>
                      <select id="availability" name="availability" value={formData.availability} onChange={handleChange} className="field">
                        <option value="full_time">Full-Time</option>
                        <option value="part_time">Part-Time</option>
                        <option value="as_needed">As Needed</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                )}

                {userType === 'provider' && (
                  <div className="field-group" style={{ marginTop: '1.5rem' }}>
                    <label className="field-label">Skills</label>
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
                      <button type="button" onClick={handleAddCustomSkill} className="btn btn-outline">
                        + Add
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      {availableSkills.map((skill: any) => {
                        const selected = formData.skillIds.includes(skill.id);
                        return (
                          <label
                            key={skill.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-sm)', cursor: 'pointer',
                              background: selected ? 'var(--accent-alpha)' : 'transparent',
                              padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)',
                              border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                            }}
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
                          </label>
                        );
                      })}
                      {availableSkills.length === 0 && <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No skills available. Add a custom skill above.</span>}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isUploading} className="btn btn-accent">
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditProfilePage);
