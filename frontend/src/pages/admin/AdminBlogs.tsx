import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAdminHeader } from '@/components/admin/AdminLayout';
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
            queryClient.invalidateQueries({ queryKey: ['home-page'] });
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
            queryClient.invalidateQueries({ queryKey: ['home-page'] });
        },
    });

    const isFormOpen = showAdd || editingBlog;

    const headerActions = (
        <button className="admin-add-btn" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus /> Add Blog
        </button>
    );

    useAdminHeader('Blogs', headerActions);

    return (
        <>
            {isLoading ? (
                <div className="admin-empty">
                    <p>Loading blogs…</p>
                </div>
            ) : !blogs.length ? (
                <div className="admin-empty">
                    <FileText />
                    <p>No blogs yet.</p>
                </div>
            ) : (
                <section className="admin-list-shell">
                    <div className="admin-table-wrap">
                        <table className="admin-data-table">
                            <thead>
                                <tr>
                                    <th>Blog</th>
                                    <th>Tag</th>
                                    <th>Published</th>
                                    <th>Excerpt</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blogs.map((blog) => (
                                    <tr key={blog.id}>
                                        <td>
                                            <div className="admin-table-primary-cell">
                                                {blog.image_url ? (
                                                    <img className="admin-table-thumb" src={blog.image_url} alt={blog.title} />
                                                ) : (
                                                    <div className="admin-table-thumb admin-table-thumb--placeholder">
                                                        <FileText size={16} />
                                                    </div>
                                                )}
                                                <div className="admin-table-copy">
                                                    <span className="admin-table-title">{blog.title}</span>
                                                    <span className="admin-table-subtitle">
                                                        {blog.content?.slice(0, 88) || 'No content added yet.'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="admin-table-chip admin-table-chip--neutral">
                                                {blog.tag || 'Editorial'}
                                            </span>
                                        </td>
                                        <td className="admin-table-date">
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className="admin-table-subtitle admin-table-subtitle--clamp">
                                                {blog.excerpt || 'No excerpt added yet.'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-table-actions">
                                                <button
                                                    className="admin-icon-btn"
                                                    onClick={() => startEdit(blog)}
                                                    aria-label={`Edit ${blog.title}`}
                                                >
                                                    <Pencil />
                                                </button>
                                                <button
                                                    className="admin-icon-btn admin-icon-btn--danger"
                                                    onClick={() => {
                                                        if (confirm(`Delete "${blog.title}"?`)) deleteMutation.mutate(blog.id);
                                                    }}
                                                    aria-label={`Delete ${blog.title}`}
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

            {/* Add / Edit Modal */}
            {isFormOpen && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingBlog ? 'Edit Blog' : 'Add Blog'}</h2>
                            <button className="modal-close" onClick={resetForm}><X /></button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
                            <div className="modal-body modal-body--scroll">
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
                                            <div className="admin-media-frame">
                                                <img src={imagePreview} alt="" />
                                                <button type="button" className="admin-image-remove-btn" onClick={() => { setImageFile(null); setImagePreview(null); }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <button type="button" className="admin-add-btn" onClick={() => fileRef.current?.click()}>
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
        </>
    );
}
