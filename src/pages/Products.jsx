import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, X, Upload, Search, Folder, Box } from 'lucide-react';

export const Products = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ----------------------------------------------------
  // Product Form State
  // ----------------------------------------------------
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState(''); // New Brand state
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodUploading, setProdUploading] = useState(false);
  const [prodSubmitLoading, setProdSubmitLoading] = useState(false);

  // ----------------------------------------------------
  // Category Form State
  // ----------------------------------------------------
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catUploading, setCatUploading] = useState(false);
  const [catSubmitLoading, setCatSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      const { data: catData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      
      if (prodData) setProducts(prodData);
      if (catData) setCategories(catData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Product Form Triggers & Submits
  // ----------------------------------------------------
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('');
    setProdCategoryId(categories.length > 0 ? categories[0].id : '');
    setProdPrice('');
    setProdStock('');
    setProdDescription('');
    setProdImageUrl('');
    setProdIsActive(true);
    setProductDrawerOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProdName(product.name || '');
    setProdBrand(product.brand || '');
    setProdCategoryId(product.category_id || '');
    setProdPrice(product.price ? product.price.toString() : '');
    setProdStock(product.stock ? product.stock.toString() : '0');
    setProdDescription(product.description || '');
    setProdImageUrl(product.image || '');
    setProdIsActive(product.status !== false);
    setProductDrawerOpen(true);
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
      brand: prodBrand || null, // Brand included in payload
      category_id: prodCategoryId || null,
      price: parseFloat(prodPrice) || 0,
      stock: parseInt(prodStock) || 0,
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
      setProductDrawerOpen(false);
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
  // Category Form Triggers & Submits
  // ----------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCatImageUrl('');
    setCategoryDrawerOpen(true);
  };

  const handleOpenEditCategory = (category) => {
    setEditingCategory(category);
    setCatName(category.name || '');
    setCatSlug(category.slug || '');
    setCatDescription(category.description || '');
    setCatImageUrl(category.image_url || '');
    setCategoryDrawerOpen(true);
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCatUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setCatImageUrl(publicUrl);
    } catch (err) {
      alert('Error uploading category image: ' + err.message);
    } finally {
      setCatUploading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCatSubmitLoading(true);

    const payload = {
      name: catName,
      slug: catSlug.toLowerCase().replace(/\s+/g, '-'),
      description: catDescription,
      image_url: catImageUrl || null,
      updated_at: new Date()
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            ...payload,
            created_at: new Date()
          });
        if (error) throw error;
      }

      await fetchData();
      setCategoryDrawerOpen(false);
    } catch (err) {
      alert('Error saving category: ' + err.message);
    } finally {
      setCatSubmitLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category will become unassigned.')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', catId);
        
        if (error) throw error;
        await fetchData();
      } catch (err) {
        alert('Error deleting category: ' + err.message);
      }
    }
  };

  // Local filter for search bar
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        gap: '8px',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            borderBottom: activeTab === 'products' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <Box size={18} /> Products
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <Folder size={18} /> Categories
        </button>
      </div>

      {/* Header controls (Search & Action button) */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={activeTab === 'products' ? "Search products or brands..." : "Search categories..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        {activeTab === 'products' ? (
          <button onClick={handleOpenAddProduct} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', height: '40px' }}>
            <Plus size={18} /> Add Product
          </button>
        ) : (
          <button onClick={handleOpenAddCategory} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', height: '40px' }}>
            <Plus size={18} /> Add Category
          </button>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* PRODUCTS TAB VIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'products' && (
        <section className="table-card">
          <div className="table-responsive">
            {loading ? (
              <div className="skeleton" style={{ height: '300px' }}></div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No products found. Click "Add Product" to create one.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Brand</th>
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
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No Img</span>
                            )}
                          </div>
                          <span style={{ fontWeight: '600' }}>{prod.name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                        {prod.brand || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Generic</span>}
                      </td>
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
                        <span className={`status-badge ${prod.status ? 'completed' : 'cancelled'}`}>
                          {prod.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenEditProduct(prod)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteProduct(prod.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}>
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
      )}

      {/* ---------------------------------------------------- */}
      {/* CATEGORIES TAB VIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'categories' && (
        <section className="table-card">
          <div className="table-responsive">
            {loading ? (
              <div className="skeleton" style={{ height: '300px' }}></div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No categories found. Click "Add Category" to list a new department.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Slug Code</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id}>
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
                            overflow: 'hidden',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}>
                            {cat.image_url ? (
                              <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              cat.name[0]
                            )}
                          </div>
                          <span style={{ fontWeight: '600' }}>{cat.name}</span>
                        </div>
                      </td>
                      <td><code>{cat.slug}</code></td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.description || 'No description provided'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenEditCategory(cat)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}>
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
      )}

      {/* ---------------------------------------------------- */}
      {/* PRODUCT DRAWERS */}
      {/* ---------------------------------------------------- */}
      {productDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setProductDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {editingProduct ? 'Edit Inventory Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="product-form" onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Product Name */}
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Premium White Basmati Rice"
                    required
                  />
                </div>

                {/* Brand Field */}
                <div className="form-group">
                  <label className="form-label">Brand Name</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Daawat, Tata, Fortune..."
                  />
                </div>

                {/* Department Category */}
                <div className="form-group">
                  <label className="form-label">Department Category</label>
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

                {/* Price & Stock */}
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="form-control"
                      placeholder="e.g. 19.99"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stock Units</label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="form-control"
                      placeholder="e.g. 500"
                      required
                    />
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={prodIsActive}
                      onChange={(e) => setProdIsActive(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    Active for shop
                  </label>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Describe package sizes, case volumes, tax guidelines..."
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn btn-secondary" style={{ display: 'flex', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <Upload size={16} /> {prodUploading ? 'Uploading...' : 'Upload Image'}
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

              </form>
            </div>

            <div className="drawer-footer">
              <button onClick={() => setProductDrawerOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button form="product-form" type="submit" className="btn btn-primary" disabled={prodSubmitLoading || prodUploading}>
                {prodSubmitLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CATEGORY DRAWERS */}
      {/* ---------------------------------------------------- */}
      {categoryDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setCategoryDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {editingCategory ? 'Edit Department Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setCategoryDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="category-form" onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Category Name */}
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCategory) setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    className="form-control"
                    placeholder="e.g. Beverages & Spirits"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="form-group">
                  <label className="form-label">Slug Code (URL Reference)</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="form-control"
                    placeholder="e.g. beverages-spirits"
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="Describe the items grouped under this wholesale department..."
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Category Banner Image</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn btn-secondary" style={{ display: 'flex', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <Upload size={16} /> {catUploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        style={{ display: 'none' }}
                        disabled={catUploading}
                      />
                    </label>
                    {catImageUrl && (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '1px solid var(--border)'
                      }}>
                        <img src={catImageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="drawer-footer">
              <button onClick={() => setCategoryDrawerOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button form="category-form" type="submit" className="btn btn-primary" disabled={catSubmitLoading || catUploading}>
                {catSubmitLoading ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
