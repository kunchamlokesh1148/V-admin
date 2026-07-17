import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Plus, Edit2, Trash2, Upload, Box, Folder, Check, X } from 'lucide-react';

export const Products = () => {
  // Navigation tabs: 'all', 'add', 'categories_brands'
  const [activeView, setActiveView] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ----------------------------------------------------
  // Product Form State
  // ----------------------------------------------------
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPurchaseCost, setProdPurchaseCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodWholesaleUnit, setProdWholesaleUnit] = useState('Piece');
  const [prodStock, setProdStock] = useState('');
  const [prodMinAlertLimit, setProdMinAlertLimit] = useState('10');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodUploading, setProdUploading] = useState(false);
  const [prodSubmitLoading, setProdSubmitLoading] = useState(false);

  // ----------------------------------------------------
  // Categories & Brands sub-tab state
  // ----------------------------------------------------
  const [subTab, setSubTab] = useState('categories'); // 'categories' or 'brands'
  const [inputVal, setInputVal] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { id, name }
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      const { data: catData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      const { data: brandData } = await supabase.from('brands').select('*').order('name', { ascending: true });

      if (prodData) setProducts(prodData);
      if (catData) setCategories(catData);
      if (brandData) setBrands(brandData);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Product Actions
  // ----------------------------------------------------
  const handleOpenAddView = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('');
    setProdCategoryId(categories.length > 0 ? categories[0].id : '');
    setProdPurchaseCost('');
    setProdPrice('');
    setProdMrp('');
    setProdWholesaleUnit('Piece');
    setProdStock('');
    setProdMinAlertLimit('10');
    setProdDescription('');
    setProdImageUrl('');
    setProdIsActive(true);
    setActiveView('add');
  };

  const handleOpenEditView = (product) => {
    setEditingProduct(product);
    setProdName(product.name || '');
    setProdBrand(product.brand || '');
    setProdCategoryId(product.category_id || '');
    setProdPurchaseCost(product.purchase_cost ? product.purchase_cost.toString() : '');
    setProdPrice(product.price ? product.price.toString() : '');
    setProdMrp(product.mrp ? product.mrp.toString() : '');
    setProdWholesaleUnit(product.wholesale_unit || 'Piece');
    setProdStock(product.stock ? product.stock.toString() : '0');
    setProdMinAlertLimit(product.min_alert_limit ? product.min_alert_limit.toString() : '10');
    setProdDescription(product.description || '');
    setProdImageUrl(product.image || '');
    setProdIsActive(product.status !== false);
    setActiveView('add');
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProdUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `prod_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProdImageUrl(publicUrl);
    } catch (err) {
      alert('Error uploading product image: ' + err.message);
    } finally {
      setProdUploading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProdSubmitLoading(true);

    const payload = {
      name: prodName,
      brand: prodBrand || null,
      category_id: prodCategoryId || null,
      purchase_cost: parseFloat(prodPurchaseCost) || 0,
      price: parseFloat(prodPrice) || 0,
      mrp: parseFloat(prodMrp) || 0,
      wholesale_unit: prodWholesaleUnit,
      stock: parseInt(prodStock) || 0,
      min_alert_limit: parseInt(prodMinAlertLimit) || 10,
      description: prodDescription,
      image: prodImageUrl || null,
      status: prodIsActive,
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

      await fetchData();
      setActiveView('all');
    } catch (err) {
      alert('Error saving product: ' + err.message);
    } finally {
      setProdSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', prodId);

        if (error) throw error;
        await fetchData();
      } catch (err) {
        alert('Error deleting product: ' + err.message);
      }
    }
  };

  // ----------------------------------------------------
  // Categories & Brands Actions (Inline CRUD)
  // ----------------------------------------------------
  const handleAddCategoryOrBrand = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    try {
      if (subTab === 'categories') {
        const { error } = await supabase
          .from('categories')
          .insert({ name: inputVal.trim() });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brands')
          .insert({ name: inputVal.trim() });
        if (error) throw error;
      }

      setInputVal('');
      await fetchData();
    } catch (err) {
      alert('Error adding item: ' + err.message);
    }
  };

  const handleEditSave = async (id) => {
    if (!editVal.trim()) return;
    try {
      if (subTab === 'categories') {
        const { error } = await supabase
          .from('categories')
          .update({ name: editVal.trim() })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brands')
          .update({ name: editVal.trim() })
          .eq('id', id);
        if (error) throw error;
      }

      setEditingItem(null);
      await fetchData();
    } catch (err) {
      alert('Error updating item: ' + err.message);
    }
  };

  const handleDeleteCategoryOrBrand = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (subTab === 'categories') {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('brands').delete().eq('id', id);
          if (error) throw error;
        }
        await fetchData();
      } catch (err) {
        alert('Error deleting item: ' + err.message);
      }
    }
  };

  // ----------------------------------------------------
  // Local Filtering
  // ----------------------------------------------------
  const filteredProducts = products.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = !categoryFilter || p.category_id?.toString() === categoryFilter;
    const brandMatch = !brandFilter || p.brand === brandFilter;
    const statusMatch = !statusFilter || (statusFilter === 'Active' ? p.status === true : p.status === false);

    return nameMatch && categoryMatch && brandMatch && statusMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Product Catalog Main Header & Toggle View Buttons */}
      <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Product Catalog</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Manage inventory products, pricing matrix, categories, and brands.
          </p>
        </div>

        {/* Reference Button-Style Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('all')}
            className={`btn btn-sm ${activeView === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: '700', borderRadius: '4px' }}
          >
            All Products
          </button>
          <button
            onClick={handleOpenAddView}
            className={`btn btn-sm ${activeView === 'add' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: '700', borderRadius: '4px' }}
          >
            + Add Product
          </button>
          <button
            onClick={() => { setActiveView('categories_brands'); setSubTab('categories'); }}
            className={`btn btn-sm ${activeView === 'categories_brands' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: '700', borderRadius: '4px' }}
          >
            Categories & Brands
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ALL PRODUCTS VIEW */}
      {/* ---------------------------------------------------- */}
      {activeView === 'all' && (
        <>
          {/* Filters Row */}
          <div className="card products-filter-grid" style={{
            padding: '16px 20px'
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
              style={{ height: '40px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="form-control"
              style={{ height: '40px' }}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ height: '40px' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Table Card */}
          <section className="table-card">
            <div className="table-responsive">
              {loading ? (
                <div className="skeleton" style={{ height: '300px' }}></div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No products found matching filters.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Purchase Price</th>
                      <th>Wholesale Price</th>
                      <th>MRP</th>
                      <th>Unit</th>
                      <th>Stock Qty</th>
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
                            <span style={{ fontWeight: '600' }}>{prod.name}</span>
                          </div>
                        </td>
                        <td>{prod.categories?.name || 'Unassigned'}</td>
                        <td style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                          {prod.brand || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Generic</span>}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {prod.purchase_cost ? `₹${prod.purchase_cost.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                          ₹{prod.price ? prod.price.toFixed(2) : '0.00'}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {prod.mrp ? `₹${prod.mrp.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {prod.wholesale_unit || 'Piece'}
                        </td>
                        <td>
                          <span style={{
                            fontWeight: '600',
                            color: prod.stock > (prod.min_alert_limit || 10) ? 'inherit' : prod.stock > 0 ? 'var(--warning)' : 'var(--error)'
                          }}>
                            {prod.stock} {prod.wholesale_unit || 'Piece'}(s)
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${prod.status ? 'completed' : 'cancelled'}`}>
                            {prod.status ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenEditView(prod)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }} title="Edit Product">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }} title="Delete Product">
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
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD/EDIT INLINE PRODUCT FORM */}
      {/* ---------------------------------------------------- */}
      {activeView === 'add' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', color: 'var(--secondary)' }}>
            {editingProduct ? 'EDIT WHOLSEALE PRODUCT' : 'REGISTER NEW WHOLESALE PRODUCT'}
          </h2>

          <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="form-control"
                placeholder="e.g. Maggi Masala Noodles"
                required
              />
            </div>

            {/* Category & Brand */}
            <div className="grid grid-2" style={{ gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category *</label>
                <select
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brand (Optional)</label>
                <select
                  value={prodBrand}
                  onChange={(e) => setProdBrand(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Matrix & Packaging Unit */}
            <div className="grid grid-4" style={{ gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Purchase Cost (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={prodPurchaseCost}
                  onChange={(e) => setProdPurchaseCost(e.target.value)}
                  className="form-control"
                  placeholder="Purchase price"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Wholesale Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="form-control"
                  placeholder="Wholesale selling price"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MRP (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={prodMrp}
                  onChange={(e) => setProdMrp(e.target.value)}
                  className="form-control"
                  placeholder="Maximum retail price"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Wholesale Unit *</label>
                <select
                  value={prodWholesaleUnit}
                  onChange={(e) => setProdWholesaleUnit(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="Piece">Piece</option>
                  <option value="Pack">Pack</option>
                  <option value="Box">Box</option>
                  <option value="Case">Case</option>
                </select>
              </div>
            </div>

            {/* Stock, Alert limit, Status */}
            <div className="grid grid-3" style={{ gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="form-control"
                  placeholder="Initial stock"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Min Alert Limit *</label>
                <input
                  type="number"
                  value={prodMinAlertLimit}
                  onChange={(e) => setProdMinAlertLimit(e.target.value)}
                  className="form-control"
                  placeholder="Alert threshold"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status *</label>
                <select
                  value={prodIsActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setProdIsActive(e.target.value === 'Active')}
                  className="form-control"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Product Description</label>
              <textarea
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                className="form-control"
                rows="4"
                placeholder="Product wholesale package details, weights, contents description..."
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label className="btn btn-secondary" style={{ display: 'flex', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <Upload size={16} /> {prodUploading ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                    style={{ display: 'none' }}
                    disabled={prodUploading}
                  />
                </label>
                {prodImageUrl && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <img src={prodImageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Buttons Row */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <button type="button" onClick={() => setActiveView('all')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={prodSubmitLoading || prodUploading}>
                {prodSubmitLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CATEGORIES & BRANDS VIEW */}
      {/* ---------------------------------------------------- */}
      {activeView === 'categories_brands' && (
        <div className="card" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Folder size={20} style={{ color: 'var(--primary)' }} /> Manage Categories & Brands
          </h2>

          {/* Sub-tab selection */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-light)',
            gap: '24px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => { setSubTab('categories'); setEditingItem(null); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                borderBottom: subTab === 'categories' ? '3px solid var(--primary)' : '3px solid transparent',
                color: subTab === 'categories' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => { setSubTab('brands'); setEditingItem(null); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                borderBottom: subTab === 'brands' ? '3px solid var(--primary)' : '3px solid transparent',
                color: subTab === 'brands' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              Brands ({brands.length})
            </button>
          </div>

          {/* Inline Add Form */}
          <form onSubmit={handleAddCategoryOrBrand} style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <input
              type="text"
              placeholder={subTab === 'categories' ? "Enter new category name..." : "Enter new brand name..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="form-control"
              style={{ flex: 1, height: '40px' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ height: '40px', padding: '0 24px' }}>
              {subTab === 'categories' ? 'Add Category' : 'Add Brand'}
            </button>
          </form>

          {/* Inline Listing Grid */}
          <div className="grid grid-2" style={{ gap: '16px' }}>
            {(subTab === 'categories' ? categories : brands).map((item) => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {editingItem && editingItem.id === item.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <input
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="form-control"
                      style={{ height: '28px', padding: '0 8px', fontSize: '0.85rem', flex: 1 }}
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--success)' }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ color: 'var(--secondary)' }}>{item.name}</span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                      <button
                        onClick={() => { setEditingItem(item); setEditVal(item.name); }}
                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategoryOrBrand(item.id)}
                        style={{ border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
