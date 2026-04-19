import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAdminHeader } from '@/components/admin/AdminLayout';
import { Category } from '@/types/fabric';
import { Plus, Pencil, Trash2, Upload, X, FolderOpen, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminArticles.css';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const editFileRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.categories.list();
      return data as Category[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `categories/${Date.now()}.${fileExt}`;
    const { publicUrl } = await api.admin.upload(file, fileName);
    return publicUrl;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      let imageUrl: string | null = null;
      if (newImageFile) imageUrl = await uploadImage(newImageFile);
      await api.categories.create({ name: newName.toLowerCase(), image_url: imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['home-page'] });
      setShowAdd(false);
      setNewName('');
      setNewImageFile(null);
      setNewImagePreview(null);
      setSaving(false);
    },
    onError: () => setSaving(false),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingCategory) return;
      setSaving(true);
      let imageUrl = editingCategory.image_url;
      if (editImageFile) imageUrl = await uploadImage(editImageFile);
      await api.categories.update(editingCategory.id, { name: editName.toLowerCase(), image_url: imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['home-page'] });
      setEditingCategory(null);
      setSaving(false);
    },
    onError: () => setSaving(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.categories.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['home-page'] });
    },
  });

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditImagePreview(cat.image_url);
    setEditImageFile(null);
  };

  const headerActions = (
    <button className="admin-add-btn" onClick={() => setShowAdd(true)}>
      <Plus /> Add Category
    </button>
  );

  useAdminHeader('Categories', headerActions);

  return (
    <>
      {isLoading ? (
        <div className="admin-empty">
          <p>Loading categories…</p>
        </div>
      ) : !categories.length ? (
        <div className="admin-empty">
          <FolderOpen />
          <p>No categories yet.</p>
        </div>
      ) : (
        <section className="admin-list-shell">
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Image</th>
                  <th>Manage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="admin-table-copy admin-table-copy--solo">
                        <span className="admin-table-title admin-item-overlay-title--caps">{cat.name}</span>
                        <span className="admin-table-subtitle">Used to group articles and drive storefront filtering.</span>
                      </div>
                    </td>
                    <td>
                      {cat.image_url ? (
                        <img className="admin-table-thumb" src={cat.image_url} alt={cat.name} />
                      ) : (
                        <div className="admin-table-thumb admin-table-thumb--placeholder">
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/123admin/articles?category=${encodeURIComponent(cat.name)}`} className="admin-link-btn">
                        <FileText size={16} />
                        View Articles
                      </Link>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-icon-btn"
                          onClick={() => startEdit(cat)}
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          onClick={() => {
                            if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                          }}
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content modal-content--narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }}>
              <div className="modal-body">
                <div className="article-form">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-input" value={newName} onChange={e => setNewName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image (optional)</label>
                    {newImagePreview ? (
                      <div className="admin-media-frame">
                        <img src={newImagePreview} alt="" />
                        <button type="button" className="admin-image-remove-btn" onClick={() => { setNewImageFile(null); setNewImagePreview(null); }}><X /></button>
                      </div>
                    ) : (
                      <button type="button" className="admin-add-btn" onClick={() => newFileRef.current?.click()}>
                        <Upload /> Upload Image
                      </button>
                    )}
                    <input ref={newFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setNewImageFile(f); const r = new FileReader(); r.onload = () => setNewImagePreview(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel-modal" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="admin-add-btn" disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-content modal-content--narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Category</h2>
              <button className="modal-close" onClick={() => setEditingCategory(null)}><X /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(); }}>
              <div className="modal-body">
                <div className="article-form">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image</label>
                    {editImagePreview ? (
                      <div className="admin-media-frame">
                        <img src={editImagePreview} alt="" />
                        <button type="button" className="admin-image-remove-btn" onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}><X /></button>
                      </div>
                    ) : (
                      <button type="button" className="admin-add-btn" onClick={() => editFileRef.current?.click()}>
                        <Upload /> Upload Image
                      </button>
                    )}
                    <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setEditImageFile(f); const r = new FileReader(); r.onload = () => setEditImagePreview(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel-modal" onClick={() => setEditingCategory(null)}>Cancel</button>
                <button type="submit" className="admin-add-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
