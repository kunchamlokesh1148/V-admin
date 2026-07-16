import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, X, Search, Upload } from 'lucide-react';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (data) setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setSlug(category.slug || '');
    setDescription(category.description || '');
    setImageUrl(category.image_url || '');
    setDrawerOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to products bucket (we reuse the products bucket for catalog assets)
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
      alert('Error uploading category image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const payload = {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      description,
      image_url: imageUrl,
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

      await fetchCategories();
      setDrawerOpen(false);
    } catch (err) {
      alert('Error saving category: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (catId) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category will become unassigned.')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', catId);
        
        if (error) throw error;
        await fetchCategories();
      } catch (err) {
        alert('Error deleting category: ' + err.message);
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Search and add controls */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', height: '40px' }}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Categories Table */}
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
                        <button onClick={() => handleOpenEdit(cat)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}>
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
                {editingCategory ? 'Edit Department Category' : 'Add New Department Category'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-icon btn-secondary" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="category-form" onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Category Name */}
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
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
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="form-control"
                    placeholder="e.g. beverages-spirits"
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '1px solid var(--border)'
                      }}>
                        <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <button form="category-form" type="submit" className="btn btn-primary" disabled={submitLoading || uploading}>
                {submitLoading ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
