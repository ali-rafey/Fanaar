import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowLeft } from 'lucide-react';
import './BlogDetail.css';

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="blog-detail-loading">
          <div className="blog-detail-spinner" />
        </div>
      </MainLayout>
    );
  }

  if (!blog) {
    return (
      <MainLayout>
        <div className="blog-detail-loading">
          <p>Blog post not found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="blog-detail">
        {blog.image_url && (
          <div className="blog-detail-hero">
            <img src={blog.image_url} alt={blog.title} />
            <div className="blog-detail-hero-overlay" />
          </div>
        )}

        <div className="blog-detail-inner">
          <button className="blog-detail-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="blog-detail-meta">
            {blog.tag && <span className="blog-detail-tag">{blog.tag}</span>}
            <span className="blog-detail-date">
              {new Date(blog.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="blog-detail-title">{blog.title}</h1>

          {blog.excerpt && (
            <p className="blog-detail-excerpt">{blog.excerpt}</p>
          )}

          <div className="blog-detail-content">
            {blog.content?.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
