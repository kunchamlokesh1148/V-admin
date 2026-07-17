import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IndianRupee, ShoppingBag, Box, Users, AlertTriangle, ArrowUpRight, ChevronRight } from 'lucide-react';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    customers: 0,
    lowStock: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        // Fetch products count
        const { count: prodCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Fetch low stock products count (stock <= 5 and active)
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('stock', 5)
          .eq('status', true);

        // Fetch orders count & data
        const { data: ordersData, count: ordCount } = await supabase
          .from('orders')
          .select('*, profiles(company_name, full_name)');

        // Fetch customers count (from profiles)
        const { count: custCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Calculate sales (exclude Cancelled orders)
        const totalSales = ordersData
          ? ordersData
              .filter(o => o.status?.toLowerCase() !== 'cancelled')
              .reduce((sum, o) => sum + (o.total_amount || 0), 0)
          : 0;

        setMetrics({
          sales: totalSales,
          orders: ordCount || 0,
          products: prodCount || 0,
          customers: custCount || 0,
          lowStock: lowStockCount || 0
        });

        // Get 5 recent orders
        if (ordersData) {
          const sorted = [...ordersData]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
          setRecentOrders(sorted);
        }
      } catch (err) {
        console.error('Error loading dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 5-Column Metrics Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {/* Sales */}
        <div className="metric-card">
          <div className="metric-details">
            <span className="metric-label">Wholesale Revenue</span>
            <span className="metric-value">
              {loading ? '...' : `₹${metrics.sales.toFixed(2)}`}
            </span>
          </div>
          <div className="metric-icon blue">
            <IndianRupee size={22} />
          </div>
        </div>

        {/* Orders */}
        <div className="metric-card">
          <div className="metric-details">
            <span className="metric-label">Total B2B Orders</span>
            <span className="metric-value">
              {loading ? '...' : metrics.orders}
            </span>
          </div>
          <div className="metric-icon indigo">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Products */}
        <div className="metric-card">
          <div className="metric-details">
            <span className="metric-label">Catalog SKUs</span>
            <span className="metric-value">
              {loading ? '...' : metrics.products}
            </span>
          </div>
          <div className="metric-icon green">
            <Box size={22} />
          </div>
        </div>

        {/* Customers */}
        <div className="metric-card">
          <div className="metric-details">
            <span className="metric-label">Wholesalers Registered</span>
            <span className="metric-value">
              {loading ? '...' : metrics.customers}
            </span>
          </div>
          <div className="metric-icon amber">
            <Users size={22} />
          </div>
        </div>

        {/* Low Stock Warn */}
        <div className="metric-card" style={{
          borderColor: metrics.lowStock > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-light)',
          backgroundColor: metrics.lowStock > 0 ? 'var(--error-light)' : 'var(--bg-card)'
        }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: metrics.lowStock > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
              Low Stock alerts
            </span>
            <span className="metric-value" style={{ color: metrics.lowStock > 0 ? 'var(--error)' : 'inherit' }}>
              {loading ? '...' : metrics.lowStock}
            </span>
          </div>
          <div className="metric-icon" style={{
            backgroundColor: metrics.lowStock > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: metrics.lowStock > 0 ? 'var(--error)' : 'var(--warning)'
          }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="table-card">
        <div className="table-header">
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Recent Wholesale Shipments</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Track recently submitted B2B requests</p>
          </div>
          <Link to="/orders" className="btn btn-secondary">
            Manage Orders <ChevronRight size={16} />
          </Link>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '220px' }}></div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No orders placed in catalog.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Client Company</th>
                  <th>Status</th>
                  <th>Total Cost</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: '600' }}>#{ord.id.slice(0, 8)}...</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{ord.profiles?.company_name || 'Apex Business Partner'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.profiles?.full_name || 'Client'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        ord.status === 'Delivered' ? 'completed' :
                        ord.status === 'Cancelled' ? 'cancelled' :
                        ord.status === 'Out For Delivery' || ord.status === 'Packed' || ord.status === 'Accepted' ? 'shipped' : 'pending'
                      }`} style={{ textTransform: 'capitalize' }}>
                        {ord.status || 'Placed'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>₹{ord.total_amount ? ord.total_amount.toFixed(2) : '0.00'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(ord.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td>
                      <Link to={`/orders/${ord.id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '4px' }}>
                        Inspect <ArrowUpRight size={14} />
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
