import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Clock, MapPin, IndianRupee, Building, Phone, Mail, Truck } from 'lucide-react';

export const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Delivery Staff states
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    fetchStaffList();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*, profiles(*), delivery_staff(*)')
        .eq('id', id)
        .single();

      if (orderErr) throw orderErr;
      setOrder(orderData);

      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', id);

      if (itemsErr) throw itemsErr;
      setOrderItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('delivery_staff')
        .select('*')
        .eq('status', 'Active')
        .order('name', { ascending: true });

      if (!error && data) {
        setStaffList(data);
      }
    } catch (err) {
      console.error('Error loading active delivery staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
        
      if (error) throw error;
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert('Error saving status update: ' + err.message);
    }
  };

  const handleAssignStaff = async (staffId) => {
    try {
      const parsedId = staffId ? parseInt(staffId) : null;
      const { error } = await supabase
        .from('orders')
        .update({ delivery_staff_id: parsedId })
        .eq('id', order.id);

      if (error) throw error;
      
      // Reload order details to refresh nested delivery partner info
      await fetchOrderDetails();
    } catch (err) {
      alert('Error assigning delivery partner: ' + err.message);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }}></div>;
  }

  if (!order) {
    return (
      <div className="card text-center" style={{ padding: '60px 40px' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
          This order does not exist or has been deleted.
        </p>
        <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>

      {/* Audit Meta Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Wholesale Invoice Reference</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '4px' }}>
              #{order.id}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Received on {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={order.status || 'Placed'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="form-control"
              style={{
                height: '40px',
                padding: '0 12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                width: '180px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 
                  order.status === 'Delivered' ? 'var(--success-light)' :
                  order.status === 'Cancelled' ? 'var(--error-light)' :
                  order.status === 'Placed' ? 'var(--warning-light)' : 'var(--info-light)',
                color:
                  order.status === 'Delivered' ? 'var(--success)' :
                  order.status === 'Cancelled' ? 'var(--error)' :
                  order.status === 'Placed' ? 'var(--warning)' : 'var(--info)',
                border: '1px solid var(--border)'
              }}
            >
              <option value="Placed" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Placed</option>
              <option value="Accepted" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Accepted</option>
              <option value="Packed" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Packed</option>
              <option value="Out For Delivery" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Out For Delivery</option>
              <option value="Delivered" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Delivered</option>
              <option value="Cancelled" style={{ backgroundColor: '#fff', color: 'var(--text-main)' }}>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Order Items Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            Wholesale Package Contents
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>
                      {item.products?.name || 'Catalog Product'}
                    </td>
                    <td>₹{item.price ? item.price.toFixed(2) : '0.00'}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      ₹{((item.price || 0) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Client Details */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} style={{ color: 'var(--primary)' }} /> Client Account
            </h4>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>
                  {order.profiles?.company_name || 'Apex Wholesale Client'}
                </strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {order.profiles?.full_name || 'Representative'}
                </span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Phone size={14} /> {order.profiles?.mobile_number || order.profiles?.phone || 'No phone recorded'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Mail size={14} /> {order.profiles?.email || 'No email recorded'}
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} /> Shipping Destination
            </h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {order.delivery_address || 'No delivery address recorded.'}
            </div>
          </div>

          {/* Assign Delivery Partner Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} style={{ color: 'var(--primary)' }} /> Delivery Partner
            </h4>
            {loadingStaff ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading partners...</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select
                  value={order.delivery_staff_id || ''}
                  onChange={(e) => handleAssignStaff(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.875rem', height: '36px' }}
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
                {order.delivery_staff && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-light)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    marginTop: '4px'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {order.delivery_staff.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Phone size={12} /> {order.delivery_staff.phone}
                    </div>
                    {order.delivery_staff.vehicle_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <Truck size={12} /> {order.delivery_staff.vehicle_number}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={18} style={{ color: 'var(--primary)' }} /> Financial Summary
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Freight Logistics</span>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>FREE</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
              <div className="flex-between" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--secondary)' }}>
                <span>Invoice Total</span>
                <span>₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
};
