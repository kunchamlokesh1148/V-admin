import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, RotateCw } from 'lucide-react';

export const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: ords } = await supabase.from('orders').select('*');
      const { data: items } = await supabase.from('order_items').select('*, products(name, category_id, categories(name))');
      
      if (ords) setOrders(ords);
      if (items) setOrderItems(items);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. KPI Calculations
  const grossRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const inTransitValue = orders
    .filter(o => o.status === 'Out For Delivery')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const pendingBacklog = orders
    .filter(o => ['Placed', 'Accepted', 'Packed'].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const totalOrders = orders.length;

  // 2. Category Share Calculations
  const categoryCounts = {};
  orderItems.forEach(item => {
    const catName = item.products?.categories?.name || 'Unassigned';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + item.quantity;
  });

  const categoryShare = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  })).sort((a, b) => b.value - a.value).slice(0, 4);

  const totalQtySold = categoryShare.reduce((sum, c) => sum + c.value, 0) || 1;

  // 3. Top Products Calculations
  const productSales = {};
  orderItems.forEach(item => {
    const prodName = item.products?.name || 'Unknown Product';
    productSales[prodName] = (productSales[prodName] || 0) + (parseFloat(item.price || 0) * item.quantity);
  });

  const topProducts = Object.keys(productSales).map(name => ({
    name,
    sales: productSales[name]
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  const maxProductSales = Math.max(...topProducts.map(p => p.sales), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Warehouse Reports & Analytics</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Examine margins, transaction volumes, and warehouse throughput metrics</p>
        </div>
        <button onClick={fetchReportData} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '8px', height: '36px' }}>
          <RotateCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ gap: '20px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>GROSS REVENUE (DELIVERED)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
            ₹{grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>IN TRANSIT PIPELINE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--info)' }}>
            ₹{inTransitValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>PENDING BACKLOG VALUE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--warning)' }}>
            ₹{pendingBacklog.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>GROSS ORDER VOLUME</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)' }}>
            {totalOrders} Orders
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '400px' }}></div>
      ) : (
        <div className="grid grid-2" style={{ gap: '32px' }}>
          {/* Chart 1: Category Distribution Donut Chart */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Category Distribution</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock share by volume of order sales</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', minHeight: '220px' }}>
              {/* SVG Donut */}
              <svg width="160" height="160" viewBox="0 0 42 42" className="donut" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-light)" strokeWidth="4"></circle>
                {(() => {
                  let accumulatedPercent = 0;
                  const colors = ['#008060', '#ffc107', '#0d6efd', '#dc3545'];
                  return categoryShare.map((cat, idx) => {
                    const percent = Math.round((cat.value / totalQtySold) * 100);
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = 100 - accumulatedPercent;
                    accumulatedPercent += percent;
                    return (
                      <circle
                        key={cat.name}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="4.2"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
                {/* Center text */}
                <g style={{ transform: 'rotate(90deg) translate(0px, -40px)' }}>
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: '3px', fontWeight: '800', fill: 'var(--secondary)' }}>
                    Share %
                  </text>
                </g>
              </svg>

              {/* Legends */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                {(() => {
                  const colors = ['#008060', '#ffc107', '#0d6efd', '#dc3545'];
                  return categoryShare.map((cat, idx) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colors[idx % colors.length], display: 'inline-block' }}></span>
                      <span style={{ fontWeight: '600' }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({Math.round((cat.value / totalQtySold) * 100)}%)</span>
                    </div>
                  ));
                })()}
                {categoryShare.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No sales data.</span>}
              </div>
            </div>
          </div>

          {/* Chart 2: Top Selling Products Bar Chart */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Top Selling Products</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ranking of catalog items based on gross sales</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '220px', justifyContent: 'center' }}>
              {topProducts.map((prod, idx) => {
                const widthPercent = Math.max(10, Math.round((prod.sales / maxProductSales) * 100));
                const colors = ['#008060', '#009e74', '#00bd8b', '#20d3a5', '#49e9bd'];
                return (
                  <div key={prod.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="flex-between" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{prod.name}</span>
                      <span style={{ color: 'var(--primary)' }}>₹{prod.sales.toFixed(0)}</span>
                    </div>
                    <div style={{ height: '14px', backgroundColor: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
                      <div style={{
                        height: '100%',
                        width: `${widthPercent}%`,
                        backgroundColor: colors[idx % colors.length],
                        borderRadius: '10px',
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                  </div>
                );
              })}
              {topProducts.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No products sold yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
