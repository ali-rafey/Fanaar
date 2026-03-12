import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FabricSpecs } from '@/types/fabric';
import { Pencil, FileText } from 'lucide-react';
import { useState } from 'react';
import './AdminArticles.css';

interface SpecsWithArticle extends FabricSpecs {
  article?: { id: string; name: string };
}

export default function AdminSpecs() {
  const queryClient = useQueryClient();
  const [editingSpec, setEditingSpec] = useState<SpecsWithArticle | null>(null);

  const { data: specs, isLoading } = useQuery({
    queryKey: ['admin-specs'],
    queryFn: async () => {
      const data = await api.admin.specs();
      return data as SpecsWithArticle[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FabricSpecs> & { id: string }) => {
      const { id, ...updates } = data;
      await api.admin.updateSpec(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-specs'] });
      setEditingSpec(null);
    },
  });

  return (
    <AdminLayout title="Specifications">
      {isLoading ? (
        <p>Loading...</p>
      ) : !specs?.length ? (
        <div className="admin-empty">
          <FileText style={{ width: '3rem', height: '3rem', color: 'hsl(30, 8%, 45%)' }} />
          <p>No specifications yet. Add specs through article management.</p>
        </div>
      ) : (
        <div className="articles-table-wrap">
          <table className="articles-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>GSM</th>
                <th>Tear Strength</th>
                <th>Tensile Strength</th>
                <th>Dye Class</th>
                <th>Thread Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.id}>
                  <td>{spec.article?.name || 'Unknown'}</td>
                  <td>{spec.gsm} g/m²</td>
                  <td>{spec.tear_strength}</td>
                  <td>{spec.tensile_strength}</td>
                  <td>{spec.dye_class}</td>
                  <td>{spec.thread_count}</td>
                  <td>
                    <button className="btn-icon" onClick={() => setEditingSpec(spec)}>
                      <Pencil />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingSpec && (
        <div className="modal-overlay" onClick={() => setEditingSpec(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '32rem' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Specifications</h2>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(editingSpec);
            }}>
              <div className="modal-body">
                <div className="article-form">
                  <div className="form-group">
                    <label className="form-label">GSM</label>
                    <input type="number" className="form-input" value={editingSpec.gsm}
                      onChange={e => setEditingSpec({ ...editingSpec, gsm: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tear Strength</label>
                    <input type="text" className="form-input" value={editingSpec.tear_strength}
                      onChange={e => setEditingSpec({ ...editingSpec, tear_strength: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tensile Strength</label>
                    <input type="text" className="form-input" value={editingSpec.tensile_strength}
                      onChange={e => setEditingSpec({ ...editingSpec, tensile_strength: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dye Class</label>
                    <input type="text" className="form-input" value={editingSpec.dye_class}
                      onChange={e => setEditingSpec({ ...editingSpec, dye_class: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thread Count</label>
                    <input type="text" className="form-input" value={editingSpec.thread_count}
                      onChange={e => setEditingSpec({ ...editingSpec, thread_count: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel-modal" onClick={() => setEditingSpec(null)}>Cancel</button>
                <button type="submit" className="admin-add-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
