'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAdmin from '../../../components/withAdmin';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (typeFilter) params.append('user_type', typeFilter);
      params.append('limit', '50');
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [typeFilter]);

  const handleStatusChange = async (userId: number, status: string) => {
    if (!confirm(`Are you sure you want to set this user as "${status}"?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const TypeBtn = ({ label, value }: { label: string; value: string }) => (
    <motion.button
      onClick={() => setTypeFilter(value)}
      style={{
        background: typeFilter === value ? 'var(--accent)' : 'var(--surface)',
        color: typeFilter === value ? '#fff' : 'var(--fg-secondary)',
        border: '1px solid var(--border)', padding: '0.35rem 0.85rem',
        fontSize: '0.8rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: FAUCET_EASING }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, fontSize: '1.75rem' }}>Users</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            className="field"
            style={{ width: 220 }}
          />
          <motion.button onClick={fetchUsers} className="btn btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
            Search
          </motion.button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <TypeBtn label="All" value="" />
        <TypeBtn label="Clients" value="client" />
        <TypeBtn label="Providers" value="provider" />
        <TypeBtn label="Admins" value="admin" />
      </div>

      {loading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : (
        <motion.div
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Verified</th>
                  <th style={thStyle}>Rating</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {users.map((u: any, i: number) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.02 * i }}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      whileHover={{ background: 'var(--accent-alpha)' }}
                    >
                      <td style={tdS}><strong style={{ fontSize: '0.85rem' }}>{u.profile?.full_name || '—'}</strong></td>
                      <td style={{ ...tdS, color: 'var(--fg-secondary)', fontSize: '0.82rem' }}>{u.email}</td>
                      <td style={tdS}>
                        <TypeBadge type={u.user_type} />
                      </td>
                      <td style={tdS}>
                        <StatusBadge status={u.status} />
                      </td>
                      <td style={tdS}>{u.email_verified ? '✅' : '❌'}</td>
                      <td style={tdS}>{u.profile?.rating_avg ? `${Number(u.profile.rating_avg).toFixed(1)} ⭐` : '—'}</td>
                      <td style={{ ...tdS, textAlign: 'right' }}>
                        <select
                          value={u.status}
                          onChange={e => handleStatusChange(u.id, e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspend</option>
                          <option value="banned">Ban</option>
                        </select>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--fg-tertiary)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <style>{`
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { font-size: 0.85rem; }
        .admin-table th { font-weight: 700; color: var(--fg-tertiary); text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.72rem; position: sticky; top: 0; background: var(--surface-hover); }
      `}</style>
    </motion.div>
  );
}

const thStyle = { padding: '0.75rem 0.85rem', textAlign: 'left' as const, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--fg-tertiary)' };
const tdS = { padding: '0.65rem 0.85rem', fontSize: '0.85rem' };

function TypeBadge({ type }) {
  const colors = { client: '#3b82f6', provider: '#eab308', admin: '#ef4444' };
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: `${colors[type] || '#6b7280'}20`, color: colors[type] || '#6b7280' }}
    >
      {type}
    </motion.span>
  );
}

function StatusBadge({ status }) {
  const colors = { active: '#22c55e', suspended: '#eab308', banned: '#ef4444' };
  return (
    <span style={{ fontWeight: 600, color: colors[status] || '#6b7280', fontSize: '0.85rem' }}>{status}</span>
  );
}

export default withAdmin(AdminUsersPage);
