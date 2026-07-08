'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import ProLinkLoader from '../../components/ui/ProLinkLoader';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profiles/me');
        setFormData({
          fullName: response.data.full_name || '',
          bio: response.data.bio || '',
          phoneNumber: response.data.phone_number || ''
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
        alert("Could not load your profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profiles/me', formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ paddingTop: '80px', minHeight: '60vh' }}>
        <ProLinkLoader />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
      <motion.div
        className="card glass"
        style={{ width: '100%', maxWidth: 480, padding: '2rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
      >
        <motion.h2
          style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Edit Your Profile
        </motion.h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <label htmlFor="fullName" className="field-label">Full Name</label>
            <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="field" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <label htmlFor="bio" className="field-label">Bio</label>
            <textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} className="field" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label htmlFor="phoneNumber" className="field-label">Phone Number</label>
            <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="field" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <motion.button type="submit" disabled={saving} className="btn btn-accent" style={{ width: '100%' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}