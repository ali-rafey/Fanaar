import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Pencil, Trash2, Upload, X, FileText } from 'lucide-react';
import './AdminArticles.css';

interface Blog {
    id: string;
    title: string;
    excerpt: string | null;
    content: string | null;
    tag: string | null;
    image_url: string | null;
    created_at: string;
}

export default function AdminBlogs() {
    const queryClient = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        tag: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['admin-blogs'],
        queryFn: async () => {
            const data = await api.blogs.list();
            return data as Blog[];
        },
    });

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `blogs/${Date.now()}.${fileExt}`;
        const { publicUrl } = await api.admin.upload(file, fileName);
        return publicUrl;
    };

    const resetForm = () => {
        setForm({ title: '', excerpt: '', content: '', tag: '' });
        setImageFile(null);
        setImagePreview(null);
        setShowAdd(false);
        setEditingBlog(null);
    };

    const startEdit = (blog: Blog) => {
        setForm({
            title: blog.title,
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            tag: blog.tag || '',
        });
        setImagePreview(blog.image_url);
        setImageFile(null);
        setEditingBlog(blog);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            setSaving(true);
            let imageUrl = editingBlog?.image_url || null;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const payload = {
                title: form.title,
                excerpt: form.excerpt || null,
                content: form.content || null,
                tag: form.tag || null,
                image_url: imageUrl,
            };

            if (editingBlog) {
                await api.blogs.update(editingBlog.id, payload);
            } else {
                await api.blogs.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
            queryClient.invalidateQueries({ queryKey: ['all-blogs'] });
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            resetForm();
            setSaving(false);
        },
        onError: (err) => {
            console.error(err);
            setSaving(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.blogs.remove(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
            queryClient.invalidateQueries({ queryKey: ['all-blogs'] });
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        },
    });

    const isFormOpen = showAdd || editingBlog;

    return (
        <AdminLayout
            title="Blogs"
            actions={
                <button className="admin-add-btn" onClick={() => { resetForm(); setShowAdd(true); }}>
                    <Plus /> Add Blog
                </button>
            }
        >
            {isLoading ? (
                <p>Loading...</p>
            ) : !blogs.length ? (
                <div className="admin-empty">
                    <FileText style={{ width: '3rem', height: '3rem', color: 'hsl(30, 8%, 45%)' }} />
                    <p>No blogs yet.</p>
                </div>
            ) : (
                <div className="articles-table-wrap">
                    <table className="articles-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Excerpt</th>
                                <th>Tag</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blogs.map((blog) => (
                                <tr key={blog.id}>
                                    <td>
                                        {blog.image_url ? (
                                            <img src={blog.image_url} alt={blog.title} className="article-row-image" />
                                        ) : (
                                            <div className="article-row-placeholder"><FileText size={16} /></div>
                                        )}
                                    </td>
                                    <td>{blog.title}</td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {blog.excerpt || '-'}
                                    </td>
                                    <td>{blog.tag || '-'}</td>
                                    <td>
                                        <div className="article-actions">
                                            <button className="btn-icon" onClick={() => startEdit(blog)}><Pencil /></button>
                                            <button className="btn-icon btn-danger" onClick={() => {
                                                if (confirm(`Delete "${blog.title}"?`)) deleteMutation.mutate(blog.id);
                                            }}><Trash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormOpen && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '36rem' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingBlog ? 'Edit Blog' : 'Add Blog'}</h2>
                            <button className="modal-close" onClick={resetForm}><X /></button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
                            <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                                <div className="article-form">
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input type="text" className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Tag</label>
                                            <input type="text" className="form-input" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Excerpt</label>
                                        <textarea className="form-textarea" value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Content (paragraphs separated by blank lines)</label>
                                        <textarea className="form-textarea" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Image</label>
                                        {imagePreview ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={imagePreview} alt="" style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '16rem', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'hsl(0,0%,0%,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '1.5rem', height: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <button type="button" className="admin-add-btn" onClick={() => fileRef.current?.click()} style={{ background: 'hsl(35, 12%, 92%)', color: 'hsl(30, 10%, 12%)' }}>
                                                <Upload /> Upload Blog Image
                                            </button>
                                        )}
                                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) { setImageFile(f); const r = new FileReader(); r.onload = () => setImagePreview(r.result as string); r.readAsDataURL(f); }
                                        }} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel-modal" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="admin-add-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
