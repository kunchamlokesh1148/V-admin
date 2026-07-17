import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Search, Mail, Phone, Calendar, MapPin, Building, X, Eye, ShoppingBag } from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected customer drawer state
  const [selectedCust, setSelectedCust] = useState(null);
  const [custOrders, setCustOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (customer) => {
    setSelectedCust(customer);
    setDrawerOpen(true);
    setOrdersLoading(true);
    try {
      // Query complete order history matching user id
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustOrders(data || []);
    } catch (err) {
      console.error('Error loading customer order history:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const nameMatch = cust.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = cust.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = cust.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || companyMatch || emailMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Search Filter Header */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search customer name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
      </div>

      {/* Customers List Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              No wholesale business customers registered.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client Company</th>
                  <th>Primary Contact</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700' }}>{cust.company_name || 'Apex Business Partner'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {cust.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{cust.full_name || 'Unassigned'}</td>
                    <td>
                      <a href={`mailto:${cust.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                        <Mail size={14} /> {cust.email || 'N/A'}
                      </a>
                    </td>
                    <td>
                      {cust.phone || cust.mobile_number ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {cust.mobile_number || cust.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleOpenDetails(cust)} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
                        <Eye size={14} /> View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Customer Audit Drawer */}
      {drawerOpen && selectedCust && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                Customer B2B Profile Audit
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Profile Details Card */}
              <div className="card" style={{ backgroundColor: 'var(--bg-main)', borderStyle: 'solid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.25rem'
                  }}>
                    {selectedCust.full_name?.[0]?.toUpperCase() || selectedCust.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedCust.full_name || 'Wholesale Representative'}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building size={14} /> {selectedCust.company_name || 'Apex Business Partner'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{selectedCust.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{selectedCust.mobile_number || selectedCust.phone || 'No phone recorded'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: '3px' }} />
                    <div>
                      {selectedCust.address ? (
                        <>
                          {selectedCust.address}
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {selectedCust.city}, {selectedCust.state} - {selectedCust.pincode}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No shipping warehouse address configured.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History List */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} style={{ color: 'var(--primary)' }} /> Order History ({custOrders.length})
                </h4>

                {ordersLoading ? (
                  <div className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-md)' }}></div>
                ) : custOrders.length === 0 ? (
                  <div className="card text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                    No past orders recorded for this customer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {custOrders.map((ord) => (
                      <div key={ord.id} className="card" style={{
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <span style={{ fontWeight: '700', display: 'block' }}>
                            Order #{ord.id.slice(0, 8)}...
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            Date: {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontWeight: '800' }}>
                            ₹{ord.total_amount ? ord.total_amount.toFixed(2) : '0.00'}
                          </span>
                          <span className={`status-badge ${
                            ord.status === 'Delivered' ? 'completed' :
                            ord.status === 'Cancelled' ? 'cancelled' :
                            ord.status === 'Out For Delivery' || ord.status === 'Packed' || ord.status === 'Accepted' ? 'shipped' : 'pending'
                          }`} style={{ textTransform: 'capitalize' }}>
                            {ord.status || 'Placed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="drawer-footer">
              <button onClick={() => setDrawerOpen(false)} className="btn btn-secondary">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
