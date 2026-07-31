import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Eye, Search, AlertCircle } from 'lucide-react';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();

    // Requirement 3: Real-time updates for orders table
    const channel = supabase
      .channel('orders-realtime-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Orders table changed:', payload);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Orders channel subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Requirement 2: SELECT * FROM orders ORDER BY created_at DESC;
      const { data: rawOrders, error: ordersError, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Requirement 3: Log every Supabase response to browser console
      console.log('[Admin Orders] Supabase Response:', {
        data: rawOrders,
        error: ordersError,
        rowCount: count ?? rawOrders?.length ?? 0
      });

      if (ordersError) {
        console.error('[Admin Orders] Supabase returned error fetching orders:', ordersError);
        setFetchError(ordersError.message || 'Failed to fetch orders from database.');
        setOrders([]);
        return;
      }

      if (!rawOrders || rawOrders.length === 0) {
        setOrders([]);
        return;
      }

      // Requirement 4: Separate profile lookup so orders list never breaks if join fails
      const userIds = [...new Set(rawOrders.map(o => o.user_id).filter(Boolean))];
      let profilesMap = {};

      if (userIds.length > 0) {
        try {
          const { data: profilesData, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, company_name')
            .in('id', userIds);

          console.log('[Admin Orders] Profiles Lookup Response:', {
            data: profilesData,
            error: profErr
          });

          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        } catch (pErr) {
          console.error('[Admin Orders] Non-critical error fetching profiles:', pErr);
        }
      }

      // Requirement 8: Combine orders with profiles (display even if profile missing)
      const combinedOrders = rawOrders.map(ord => ({
        ...ord,
        profiles: profilesMap[ord.user_id] || null
      }));

      setOrders(combinedOrders);
    } catch (err) {
      console.error('[Admin Orders] Exception during fetchOrders:', err);
      setFetchError(err.message || 'An unexpected error occurred while loading orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) {
        console.error(`[Admin Orders] Error updating order #${orderId} status:`, error);
        alert('Failed to update status: ' + error.message);
        return;
      }
      
      setOrders(prev =>
        prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (err) {
      alert('Error updating order status: ' + err.message);
    }
  };

  // Requirement 7: Flexible filtering (handles 'pending', 'placed', case-insensitively)
  const filteredOrders = orders.filter((ord) => {
    if (statusFilter) {
      const orderStatus = (ord.status || '').toLowerCase();
      const targetFilter = statusFilter.toLowerCase();
      if (targetFilter === 'placed' || targetFilter === 'pending') {
        if (orderStatus !== 'placed' && orderStatus !== 'pending') return false;
      } else if (orderStatus !== targetFilter) {
        return false;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const idMatch = String(ord.id).toLowerCase().includes(term);
      const companyMatch = ord.profiles?.company_name?.toLowerCase().includes(term);
      const contactMatch = ord.profiles?.full_name?.toLowerCase().includes(term);
      const emailMatch = ord.profiles?.email?.toLowerCase().includes(term);
      const phoneMatch = ord.profiles?.phone?.toLowerCase().includes(term);
      const addressMatch = ord.delivery_address?.toLowerCase().includes(term);
      return idMatch || companyMatch || contactMatch || emailMatch || phoneMatch || addressMatch;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Table filters */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search order ID, company name, contact, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ width: '180px', height: '40px', padding: '0 10px' }}
          >
            <option value="">All Statuses</option>
            <option value="Placed">Placed / Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Packed">Packed</option>
            <option value="Out For Delivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requirement 9: Error Banner on Screen */}
      {fetchError && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'var(--error-light)',
          color: 'var(--error)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600'
        }}>
          <AlertCircle size={20} />
          <span>Supabase Error: {fetchError}</span>
        </div>
      )}

      {/* Orders Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
              No wholesale orders found matching criteria.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Details</th>
                  <th>Contact Email & Phone</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: '600' }}>#{ord.id}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700' }}>{ord.profiles?.full_name || 'Wholesale Buyer'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.profiles?.company_name || 'Individual Business'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                        <span>{ord.profiles?.email || 'N/A'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{ord.profiles?.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(ord.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      ₹{ord.total_amount ? Number(ord.total_amount).toFixed(2) : '0.00'}
                    </td>
                    <td>
                      <select
                        value={ord.status || 'pending'}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="form-control"
                        style={{
                          height: '32px',
                          padding: '0 8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          width: '150px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 
                            ord.status === 'Delivered' ? 'var(--success-light)' :
                            ord.status === 'Cancelled' ? 'var(--error-light)' :
                            (ord.status === 'Placed' || ord.status === 'pending') ? 'var(--warning-light)' : 'var(--info-light)',
                          color:
                            ord.status === 'Delivered' ? 'var(--success)' :
                            ord.status === 'Cancelled' ? 'var(--error)' :
                            (ord.status === 'Placed' || ord.status === 'pending') ? 'var(--warning)' : 'var(--info)',
                          border: 'none'
                        }}
                      >
                        <option value="pending" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Placed / Pending</option>
                        <option value="Accepted" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Accepted</option>
                        <option value="Packed" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Packed</option>
                        <option value="Out For Delivery" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Out For Delivery</option>
                        <option value="Delivered" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Delivered</option>
                        <option value="Cancelled" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <Link to={`/orders/${ord.id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
                        <Eye size={14} /> Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

    </div>
  );
};
