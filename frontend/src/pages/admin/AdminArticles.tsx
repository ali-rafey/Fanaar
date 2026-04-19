import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAdminHeader } from '@/components/admin/AdminLayout';
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

  const headerActions = (
    <div className="admin-toolbar">
      {categoryFilter && (
        <button className="admin-ghost-btn" onClick={() => setSearchParams({})}>
          Clear Filter: {categoryFilter}
        </button>
      )}
      <button className="admin-add-btn" onClick={() => { setEditingArticle(null); setShowForm(true); }}>
        <Plus />
        Add Article
      </button>
    </div>
  );

  useAdminHeader('Articles', headerActions, [categoryFilter]);

  return (
    <>
      {isLoading ? (
        <div className="admin-empty">
          <p>Loading articles…</p>
        </div>
      ) : !articles?.length ? (
        <div className="admin-empty">
          <Package />
          <p>No articles yet. Add your first fabric article.</p>
        </div>
      ) : (
        <section className="admin-list-shell">
          <div className="admin-table-wrap">
            <table className="admin-data-table">
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
                      <div className="admin-table-primary-cell">
                        {article.hero_image_url ? (
                          <img
                            className="admin-table-thumb"
                            src={article.hero_image_url}
                            alt={article.name}
                          />
                        ) : (
                          <div className="admin-table-thumb admin-table-thumb--placeholder">
                            {article.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="admin-table-copy">
                          <span className="admin-table-title">{article.name}</span>
                          <span className="admin-table-subtitle">
                            {article.description || 'No description added yet.'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-table-chip admin-table-chip--neutral">
                        {article.category}
                      </span>
                    </td>
                    <td className="admin-table-number">
                      {Number(article.price_aed).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className={`admin-pill ${article.in_stock ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                        onClick={() =>
                          toggleStockMutation.mutate({
                            id: article.id,
                            in_stock: !article.in_stock,
                          })
                        }
                      >
                        {article.in_stock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-icon-btn"
                          onClick={() => {
                            setEditingArticle(article);
                            setShowForm(true);
                          }}
                          aria-label={`Edit ${article.name}`}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          onClick={() => handleDelete(article.id, article.name)}
                          aria-label={`Delete ${article.name}`}
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

      {showForm && (
        <ArticleForm
          article={editingArticle}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
