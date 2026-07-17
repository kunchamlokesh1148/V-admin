import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Key, UserPlus, Users, Eye, EyeOff, ShieldAlert, CheckCircle } from 'lucide-react';

export const BusinessSettings = () => {
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  // Admin Registration State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState('');
  const [regError, setRegError] = useState('');

  // Administrators List State
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  // Toggle Visibility
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminsList(data || []);
    } catch (err) {
      console.error('Error loading admins list:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // 1. Change Password Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setPwMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Error updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  // 2. Create Administrator Handler (Using RPC security definer)
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setRegMessage('');
    setRegError('');

    if (adminPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }

    setRegLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_admin_user', {
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_name: adminName
      });

      if (error) throw error;

      if (data && data.success === false) {
        setRegError(data.message || 'Failed to create administrator.');
      } else {
        setRegMessage('New administrator account created successfully!');
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        await fetchAdmins(); // Refresh admin listing
      }
    } catch (err) {
      setRegError(err.message || 'Error invoking admin signup database routine.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page Title */}
      <div>
        <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Business Settings</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage administrative profiles, credentials, and password security policies</p>
      </div>

      <div className="grid grid-2" style={{ gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Change Password & Create Admin Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Change Password Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} style={{ color: 'var(--primary)' }} /> Change Admin Password
            </h3>
            
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pwError && (
                <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {pwError}
                </div>
              )}
              {pwMessage && (
                <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {pwMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-control"
                    placeholder="Enter at least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  placeholder="Verify password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pwLoading}>
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Create New Administrator Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} style={{ color: 'var(--primary)' }} /> Create Administrator Account
            </h3>
            
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {regError && (
                <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {regError}
                </div>
              )}
              {regMessage && (
                <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                  {regMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Administrator Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Anand Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="form-control"
                  placeholder="e.g. manager@wholesale.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Login Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="form-control"
                  placeholder="Min 8 characters password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={regLoading}>
                {regLoading ? 'Registering...' : 'Register Administrator'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Active Admin Accounts Registry List */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} /> Administrator Directory
          </h3>

          {adminsLoading ? (
            <div className="skeleton" style={{ height: '200px' }}></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {adminsList.map((admin) => (
                <div key={admin.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-main)'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.85rem'
                  }}>
                    {admin.full_name ? admin.full_name[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--secondary)' }}>
                      {admin.full_name || 'System Administrator'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {admin.email}
                    </span>
                  </div>
                  <span className="status-badge completed" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '4px 8px' }}>
                    Admin
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
