import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, X, Search, Truck, Phone } from 'lucide-react';

export const DeliveryStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffList(data || []);
    } catch (err) {
      console.error('Error fetching delivery staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setPhone('');
    setVehicleNumber('');
    setStatus('Active');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setName(staff.name || '');
    setPhone(staff.phone || '');
    setVehicleNumber(staff.vehicle_number || '');
    setStatus(staff.status || 'Active');
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Indian Phone format validation: 10 numeric digits
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    const formattedPhone = `+91${cleanedPhone}`;

    setSubmitLoading(true);

    const payload = {
      name,
      phone: formattedPhone,
      vehicle_number: vehicleNumber || null,
      status,
    };

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('delivery_staff')
          .update(payload)
          .eq('id', editingStaff.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_staff')
          .insert({
            ...payload,
            created_at: new Date()
          });

        if (error) throw error;
      }

      await fetchStaff();
      setDrawerOpen(false);
    } catch (err) {
      alert('Error saving delivery staff: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to remove this delivery staff member?')) {
      try {
        const { error } = await supabase
          .from('delivery_staff')
          .delete()
          .eq('id', staffId);

        if (error) throw error;
        await fetchStaff();
      } catch (err) {
        alert('Error removing delivery staff: ' + err.message);
      }
    }
  };

  const filteredStaff = staffList.filter((s) => {
    return s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm) ||
      s.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header and Controls */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search name, phone, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', height: '40px' }}>
          <Plus size={18} /> Add Delivery Member
        </button>
      </div>

      {/* Staff Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Truck size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              No delivery staff members registered yet.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff Details</th>
                  <th>Mobile Number</th>
                  <th>Vehicle Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          {staff.name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600' }}>{staff.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {staff.phone}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {staff.vehicle_number || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Assigned</span>}
                    </td>
                    <td>
                      <span className={`status-badge ${staff.status === 'Active' ? 'completed' : 'cancelled'}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEdit(staff)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(staff.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Drawer Overlay for Add/Edit Form */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {editingStaff ? 'Edit Delivery Member' : 'Add Delivery Member'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="staff-form" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div className="form-group">
                  <label className="form-label">Indian Mobile Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>+91</span>
                    <input
                      type="text"
                      maxLength="10"
                      value={phone.replace(/^\+91/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                      }}
                      className="form-control"
                      placeholder="Enter 10-digit number"
                      style={{ paddingLeft: '48px' }}
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Number */}
                <div className="form-group">
                  <label className="form-label">Vehicle Registration Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="form-control"
                    placeholder="e.g. KA-01-XX-9999"
                  />
                </div>

                {/* Status Toggle */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

              </form>
            </div>

            <div className="drawer-footer">
              <button onClick={() => setDrawerOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button form="staff-form" type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'Saving...' : 'Save Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
