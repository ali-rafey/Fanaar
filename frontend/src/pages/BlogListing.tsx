import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { MainLayout } from '@/components/layout/MainLayout';
import './BlogListing.css';

export default function BlogListing() {
  const navigate = useNavigate();

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['all-blogs'],
    queryFn: async () => {
      const data = await api.blogs.list();
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="blog-listing-page">
        <div className="blog-listing-header">
          <span className="blog-listing-label">Our Journal</span>
          <h1 className="blog-listing-title">Blog</h1>
          <p className="blog-listing-desc">Stories about fabric, craftsmanship, and our journey in textiles.</p>
        </div>

        <div className="blog-listing-grid">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="blog-listing-card blog-skeleton">
                  <div className="blog-listing-card-image skeleton-shimmer" />
                  <div className="blog-listing-card-body">
                    <div className="skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton-text" style={{ width: '80%', marginTop: '0.5rem' }} />
                  </div>
                </div>
              ))
            : blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="blog-listing-card"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  {blog.image_url && (
                    <div className="blog-listing-card-image">
                      <img src={blog.image_url} alt={blog.title} loading="lazy" />
                    </div>
                  )}
                  <div className="blog-listing-card-body">
                    <div className="blog-listing-card-top">
                      {blog.tag && <span className="blog-listing-tag">{blog.tag}</span>}
                      <span className="blog-listing-date">
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className="blog-listing-card-title">{blog.title}</h2>
                    <p className="blog-listing-card-excerpt">{blog.excerpt}</p>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </MainLayout>
  );
}
