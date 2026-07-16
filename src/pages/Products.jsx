import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, X, Upload, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      const { data: catData } = await supabase.from('categories').select('*');
      
      if (prodData) setProducts(prodData);
      if (catData) {
        setCategories(catData);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setPrice('');
    setStock('');
    setDescription('');
    setImageUrl('');
    setIsActive(true);
    setIsFeatured(false);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setSku(product.sku || '');
    setCategoryId(product.category_id || '');
    setPrice(product.price ? product.price.toString() : '');
    setStock(product.stock ? product.stock.toString() : '');
    setDescription(product.description || '');
    setImageUrl(product.image_url || '');
    setIsActive(product.is_active !== false); // default to true
    setIsFeatured(product.is_featured === true);
    setDrawerOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to products bucket
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err) {
      alert('Error uploading image to storage: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    const payload = {
      name,
      sku,
      category_id: categoryId || null,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      description,
      image_url: imageUrl,
      is_active: isActive,
      is_featured: isFeatured,
      updated_at: new Date()
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...payload,
            created_at: new Date()
          });
        if (error) throw error;
      }
      
      await fetchProductsAndCategories();
      setDrawerOpen(false);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (prodId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', prodId);
        
        if (error) throw error;
        await fetchProductsAndCategories();
      } catch (err) {
        alert('Error deleting product: ' + err.message);
      }
    }
  };

  // Local filter for search bar
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header filter controls */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search SKU name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', height: '40px' }}>
          <Plus size={18} /> Add Wholesale SKU
        </button>
      </div>

      {/* Inventory Table */}
      <section className="table-card">
        <div className="table-responsive">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No products found. Click "Add Wholesale SKU" to create one.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU Code</th>
                  <th>Department</th>
                  <th>Price</th>
                  <th>Stock Count</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-light)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No Img</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>{prod.name}</span>
                          {prod.is_featured && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '700' }}>Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.85rem' }}>{prod.sku || 'N/A'}</code></td>
                    <td>{prod.categories?.name || 'Unassigned'}</td>
                    <td style={{ fontWeight: '700' }}>${prod.price ? prod.price.toFixed(2) : '0.00'}</td>
                    <td>
                      <span style={{
                        fontWeight: '600',
                        color: prod.stock > 5 ? 'inherit' : prod.stock > 0 ? 'var(--warning)' : 'var(--error)'
                      }}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${prod.is_active ? 'completed' : 'cancelled'}`}>
                        {prod.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEdit(prod)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(prod.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}>
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
                {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory SKU'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="product-form" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Product Name */}
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Premium White Basmati Rice"
                    required
                  />
                </div>

                {/* SKU & Category */}
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">SKU Number</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="form-control"
                      placeholder="e.g. GROC-RICE-001"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Department Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="form-control"
                      placeholder="e.g. 19.99"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stock Units</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="form-control"
                      placeholder="e.g. 500"
                      required
                    />
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      Active for shop
                    </label>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      Feature on landing
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Describe bulk package sizes, minimum orders, organic flags..."
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn btn-secondary" style={{ display: 'flex', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                    </label>
                    {imageUrl && (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: '1px solid var(--border)'
                      }}>
                        <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  {imageUrl && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', wordBreak: 'break-all' }}>
                      Path: {imageUrl}
                    </span>
                  )}
                </div>

              </form>
            </div>

            <div className="drawer-footer">
              <button onClick={() => setDrawerOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button form="product-form" type="submit" className="btn btn-primary" disabled={submitLoading || uploading}>
                {submitLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
