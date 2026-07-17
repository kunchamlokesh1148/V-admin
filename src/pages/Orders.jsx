import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Eye, Search, AlertCircle } from 'lucide-react';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, profiles(company_name, full_name)')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
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
        
      if (error) throw error;
      
      setOrders(prev =>
        prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (err) {
      alert('Error updating order status: ' + err.message);
    }
  };

  // Local filter for search box
  const filteredOrders = orders.filter((ord) => {
    const idMatch = ord.id.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = ord.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const contactMatch = ord.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return idMatch || companyMatch || contactMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Table filters */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search order ID, company name, contact..."
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
            <option value="Placed">Placed</option>
            <option value="Accepted">Accepted</option>
            <option value="Packed">Packed</option>
            <option value="Out For Delivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

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
                  <th>Order Reference</th>
                  <th>Company Client</th>
                  <th>Order Date</th>
                  <th>Revenue Total</th>
                  <th>Shipment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: '600' }}>#{ord.id.slice(0, 8)}...</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{ord.profiles?.company_name || 'Apex Partner'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.profiles?.full_name || 'Customer'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(ord.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      ₹{ord.total_amount ? ord.total_amount.toFixed(2) : '0.00'}
                    </td>
                    <td>
                      <select
                        value={ord.status || 'Placed'}
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
                            ord.status === 'Placed' ? 'var(--warning-light)' : 'var(--info-light)',
                          color:
                            ord.status === 'Delivered' ? 'var(--success)' :
                            ord.status === 'Cancelled' ? 'var(--error)' :
                            ord.status === 'Placed' ? 'var(--warning)' : 'var(--info)',
                          border: 'none'
                        }}
                      >
                        <option value="Placed" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Placed</option>
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
