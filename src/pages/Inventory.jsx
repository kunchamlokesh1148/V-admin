import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, AlertTriangle, CheckCircle, XCircle, Plus, Minus, RotateCw } from 'lucide-react';

export const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick edits for stock level
  const handleUpdateStock = async (prodId, newStock) => {
    if (newStock < 0) return;
    setActionLoading(prev => ({ ...prev, [`stock-${prodId}`]: true }));

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', prodId);

      if (error) throw error;
      
      // Update local state instantly
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: newStock } : p));
    } catch (err) {
      alert('Error updating stock level: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`stock-${prodId}`]: false }));
    }
  };

  // Quick edits for alert limit
  const handleUpdateAlertLimit = async (prodId, newLimit) => {
    if (newLimit < 0) return;
    setActionLoading(prev => ({ ...prev, [`limit-${prodId}`]: true }));

    try {
      const { error } = await supabase
        .from('products')
        .update({ min_alert_limit: newLimit })
        .eq('id', prodId);

      if (error) throw error;
      
      // Update local state instantly
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, min_alert_limit: newLimit } : p));
    } catch (err) {
      alert('Error updating alert limit: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`limit-${prodId}`]: false }));
    }
  };

  // Metrics
  const totalSkus = products.length;
  const lowStockSkus = products.filter(p => p.status === true && p.stock > 0 && p.stock <= (p.min_alert_limit || 10)).length;
  const outOfStockSkus = products.filter(p => p.stock <= 0).length;

  const filteredProducts = products.filter((p) => {
    return p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Inventory KPI Summary */}
      <div className="grid grid-3" style={{ gap: '24px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <RotateCw size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>STOCK SKU COUNT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{totalSkus}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LOW STOCK TRIGGERED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: lowStockSkus > 0 ? 'var(--warning)' : 'inherit' }}>
              {lowStockSkus}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>OUT OF STOCK SKU</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: outOfStockSkus > 0 ? 'var(--error)' : 'inherit' }}>
              {outOfStockSkus}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter SKU or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        <button onClick={fetchInventory} className="btn btn-secondary btn-sm" style={{ height: '40px', display: 'inline-flex', gap: '8px' }}>
          <RotateCw size={16} /> Sync Stock
        </button>
      </div>

      {/* Inventory List Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No inventory products found.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU / Product Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Alert Limit</th>
                  <th>Warehouse Level</th>
                  <th>Fulfillment Status</th>
                  <th style={{ textAlign: 'center' }}>Quick Stock Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const limit = prod.min_alert_limit || 10;
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = !isOutOfStock && prod.stock <= limit;
                  const statusLabel = isOutOfStock ? 'Out Of Stock' : isLowStock ? 'Low Stock' : 'Healthy Stock';
                  const statusClass = isOutOfStock ? 'cancelled' : isLowStock ? 'pending' : 'completed';

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No Img</span>
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', display: 'block' }}>{prod.name}</span>
                            {prod.brand && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.brand}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{prod.categories?.name || 'Unassigned'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateAlertLimit(prod.id, limit - 1)}
                            disabled={actionLoading[`limit-${prod.id}`] || limit <= 0}
                            style={{ border: '1px solid var(--border)', background: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{limit}</span>
                          <button
                            onClick={() => handleUpdateAlertLimit(prod.id, limit + 1)}
                            disabled={actionLoading[`limit-${prod.id}`]}
                            style={{ border: '1px solid var(--border)', background: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {prod.stock} {prod.wholesale_unit === 'Piece' ? 'Piece' : `${prod.wholesale_unit}(s)`}
                      </td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateStock(prod.id, prod.stock - 1)}
                            disabled={actionLoading[`stock-${prod.id}`] || prod.stock <= 0}
                            style={{ border: '1px solid var(--border)', background: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: '700', minWidth: '36px', textAlign: 'center' }}>{prod.stock}</span>
                          <button
                            onClick={() => handleUpdateStock(prod.id, prod.stock + 1)}
                            disabled={actionLoading[`stock-${prod.id}`]}
                            style={{ border: '1px solid var(--border)', background: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

    </div>
  );
};
