import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
      setEditingCategory(null);
      setSaving(false);
    },
    onError: () => setSaving(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.categories.remove(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditImagePreview(cat.image_url);
    setEditImageFile(null);
  };

  return (
    <AdminLayout
      title="Categories"
      actions={
        <button className="admin-add-btn" onClick={() => setShowAdd(true)}>
          <Plus /> Add Category
        </button>
      }
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : !categories.length ? (
        <div className="admin-empty">
          <FolderOpen style={{ width: '3rem', height: '3rem', color: 'hsl(30, 8%, 45%)' }} />
          <p>No categories yet.</p>
        </div>
      ) : (
        <div className="articles-table-wrap">
          <table className="articles-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Articles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="article-row-image" />
                    ) : (
                      <div className="article-row-placeholder">{cat.name.charAt(0).toUpperCase()}</div>
                    )}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{cat.name}</td>
                  <td>
                    <Link to={`/123admin/articles?category=${encodeURIComponent(cat.name)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(30, 8%, 45%)', textDecoration: 'none', background: 'hsl(30, 10%, 96%)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                      <FileText size={16} /> View Articles
                    </Link>
                  </td>
                  <td>
                    <div className="article-actions">
                      <button className="btn-icon" onClick={() => startEdit(cat)}><Pencil /></button>
                      <button className="btn-icon btn-danger" onClick={() => {
                        if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                      }}><Trash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '28rem' }}>
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
                      <div style={{ position: 'relative' }}>
                        <img src={newImagePreview} alt="" style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '12rem', objectFit: 'cover' }} />
                        <button type="button" onClick={() => { setNewImageFile(null); setNewImagePreview(null); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'hsl(0,0%,0%,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}><X /></button>
                      </div>
                    ) : (
                      <button type="button" className="admin-add-btn" onClick={() => newFileRef.current?.click()} style={{ background: 'hsl(35, 12%, 92%)', color: 'hsl(30, 10%, 12%)' }}>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '28rem' }}>
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
                      <div style={{ position: 'relative' }}>
                        <img src={editImagePreview} alt="" style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '12rem', objectFit: 'cover' }} />
                        <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview(null); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'hsl(0,0%,0%,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}><X /></button>
                      </div>
                    ) : (
                      <button type="button" className="admin-add-btn" onClick={() => editFileRef.current?.click()} style={{ background: 'hsl(35, 12%, 92%)', color: 'hsl(30, 10%, 12%)' }}>
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
    </AdminLayout>
  );
}
