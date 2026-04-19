import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { FabricArticle, FabricSpecs, Category } from '@/types/fabric';
import { X, Upload, Trash2 } from 'lucide-react';
import './ArticleForm.css';

interface ArticleFormProps {
  article?: FabricArticle | null;
  onClose: () => void;
}

type ArticleFormState = {
  name: string;
  description: string;
  category: string;
  price_aed: number;
  price_usd: number | null;
  price_pkr: number | null;
  in_stock: boolean;
  hero_image_url: string;
};

const createInitialFormData = (article?: FabricArticle | null): ArticleFormState => ({
  name: article?.name || '',
  description: article?.description || '',
  category: article?.category || '',
  price_aed: article?.price_aed ?? 0,
  price_usd: article?.price_usd ?? null,
  price_pkr: article?.price_pkr ?? null,
  in_stock: article?.in_stock ?? true,
  hero_image_url: article?.hero_image_url || '',
});

const createInitialSpecs = (article?: FabricArticle | null): FabricSpecs => ({
  id: '',
  article_id: article?.id || '',
  gsm: 0,
  tear_strength: '',
  tensile_strength: '',
  dye_class: '',
  thread_count: '',
});

const parseOptionalPrice = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function ArticleForm({ article, onClose }: ArticleFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ArticleFormState>(() => createInitialFormData(article));
  const [specs, setSpecs] = useState<FabricSpecs>(() => createInitialSpecs(article));
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(article?.hero_image_url || null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.categories.list();
      return data as Category[];
    },
  });

  const { data: existingSpecs } = useQuery({
    queryKey: ['article-specs', article?.id],
    queryFn: async () => {
      if (!article?.id) return null;
      const data = await api.articles.getSpecs(article.id);
      return data as FabricSpecs | null;
    },
    enabled: !!article?.id,
  });

  useEffect(() => {
    setFormData(createInitialFormData(article));
    setSpecs(createInitialSpecs(article));
    setImagePreview(article?.hero_image_url || null);
  }, [article]);

  useEffect(() => {
    if (existingSpecs) {
      setSpecs(existingSpecs);
    } else if (article?.id) {
      setSpecs(createInitialSpecs(article));
    }
  }, [existingSpecs, article]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const articlePayload = {
        ...formData,
        description: formData.description.trim() || null,
        hero_image_url: formData.hero_image_url.trim() || null,
        price_usd: formData.price_usd,
        price_pkr: formData.price_pkr,
      };

      const normalizedSpecs = {
        gsm: specs.gsm,
        tear_strength: specs.tear_strength.trim(),
        tensile_strength: specs.tensile_strength.trim(),
        dye_class: specs.dye_class.trim(),
        thread_count: specs.thread_count.trim(),
      };

      const hasCompleteSpecs =
        normalizedSpecs.gsm > 0 &&
        normalizedSpecs.tear_strength.length > 0 &&
        normalizedSpecs.tensile_strength.length > 0 &&
        normalizedSpecs.dye_class.length > 0 &&
        normalizedSpecs.thread_count.length > 0;

      if (article) {
        await api.articles.update(article.id, articlePayload);
        if (hasCompleteSpecs) {
          await api.articles.upsertSpecs(article.id, normalizedSpecs);
        }
      } else {
        const newArticle = await api.articles.create(articlePayload);
        if (hasCompleteSpecs && newArticle?.id) {
          await api.articles.upsertSpecs(newArticle.id, normalizedSpecs);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      if (article?.id) {
        queryClient.invalidateQueries({ queryKey: ['article-specs', article.id] });
      }
      onClose();
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `articles/${Date.now()}.${fileExt}`;
      const { publicUrl } = await api.admin.upload(file, filePath);
      setFormData(prev => ({ ...prev, hero_image_url: publicUrl }));
    } catch (error) { console.error('Upload error:', error); alert('Failed to upload image'); }
    finally { setUploading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{article ? 'Edit Article' : 'Add New Article'}</h2>
          <button className="modal-close" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
          <div className="modal-body">
            <div className="article-form">
              <div className="form-group full-width">
                <label className="form-label">Hero Image</label>
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" className="image-preview-remove" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, hero_image_url: '' })); }}><Trash2 /></button>
                  </div>
                ) : (
                  <div className="image-upload" onClick={() => fileInputRef.current?.click()}>
                    <Upload />
                    <p>Click to upload</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </div>
                )}
                {uploading && <p className="admin-modal-note">Uploading...</p>}
              </div>
              <div className="form-group full-width">
                <label className="form-label">Article Name</label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="">Select...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price AED</label>
                  <input type="number" step="0.01" className="form-input" value={formData.price_aed} onChange={e => setFormData(prev => ({ ...prev, price_aed: Number(e.target.value) || 0 }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price USD</label>
                  <input type="number" step="0.01" className="form-input" value={formData.price_usd ?? ''} onChange={e => setFormData(prev => ({ ...prev, price_usd: parseOptionalPrice(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price PKR</label>
                  <input type="number" step="0.01" className="form-input" value={formData.price_pkr ?? ''} onChange={e => setFormData(prev => ({ ...prev, price_pkr: parseOptionalPrice(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="form-group full-width">
                <label className="form-checkbox-row">
                  <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData(prev => ({ ...prev, in_stock: e.target.checked }))} />
                  In Stock
                </label>
              </div>
              <h3 className="form-section-title">Specs (Optional)</h3>
              <div className="form-row">
                <div className="form-group"><label className="form-label">GSM</label><input type="number" className="form-input" value={specs.gsm || ''} onChange={e => setSpecs(prev => ({ ...prev, gsm: parseInt(e.target.value) || 0 }))} /></div>
                <div className="form-group"><label className="form-label">Dye Class</label><input type="text" className="form-input" value={specs.dye_class} onChange={e => setSpecs(prev => ({ ...prev, dye_class: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tear Strength</label><input type="text" className="form-input" value={specs.tear_strength} onChange={e => setSpecs(prev => ({ ...prev, tear_strength: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Tensile Strength</label><input type="text" className="form-input" value={specs.tensile_strength} onChange={e => setSpecs(prev => ({ ...prev, tensile_strength: e.target.value }))} /></div>
              </div>
              <div className="form-group full-width"><label className="form-label">Thread Count</label><input type="text" className="form-input" value={specs.thread_count} onChange={e => setSpecs(prev => ({ ...prev, thread_count: e.target.value }))} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel-modal" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-add-btn" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save Article'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
