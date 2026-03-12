import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { FabricArticle } from '@/types/fabric';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './AdminArticles.css';

export default function AdminArticles() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<FabricArticle | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-articles', categoryFilter],
    queryFn: async () => {
      const data = await api.articles.list({ category: categoryFilter || undefined });
      return data as unknown as FabricArticle[];
    },
  });

  const toggleStockMutation = useMutation({
    mutationFn: async ({ id, in_stock }: { id: string; in_stock: boolean }) => {
      await api.articles.toggleStock(id, in_stock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.articles.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout
      title="Articles"
      actions={
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {categoryFilter && (
            <button className="btn-cancel-modal" onClick={() => setSearchParams({})}>
              Clear Filter: {categoryFilter}
            </button>
          )}
          <button className="admin-add-btn" onClick={() => { setEditingArticle(null); setShowForm(true); }}>
            <Plus />
            Add Article
          </button>
        </div>
      }
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : !articles?.length ? (
        <div className="admin-empty">
          <Package style={{ width: '3rem', height: '3rem', color: 'hsl(30, 8%, 45%)' }} />
          <p>No articles yet. Add your first fabric article.</p>
        </div>
      ) : (
        <div className="articles-table-wrap">
          <table className="articles-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Price (AED)</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="article-row-name">
                      {article.hero_image_url ? (
                        <img src={article.hero_image_url} alt="" className="article-row-image" />
                      ) : (
                        <div className="article-row-placeholder">{article.name.charAt(0)}</div>
                      )}
                      <div className="article-row-info">
                        <h4>{article.name}</h4>
                        {article.description && <p>{article.description.substring(0, 50)}...</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="category-badge">{article.category}</span></td>
                  <td>{Number(article.price_aed).toFixed(2)}</td>
                  <td>
                    <button
                      className={`stock-toggle ${article.in_stock ? 'in-stock' : 'out-of-stock'}`}
                      onClick={() => toggleStockMutation.mutate({ id: article.id, in_stock: !article.in_stock })}
                    >
                      {article.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td>
                    <div className="article-actions">
                      <button className="btn-icon" onClick={() => { setEditingArticle(article); setShowForm(true); }}>
                        <Pencil />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(article.id, article.name)}>
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ArticleForm
          article={editingArticle}
          onClose={() => setShowForm(false)}
        />
      )}
    </AdminLayout>
  );
}
