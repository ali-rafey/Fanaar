import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import './BlogsSection.css';

export function BlogsSection() {
  const navigate = useNavigate();

  const { data: blogs = [] } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="blogs-container">
      <div className="blogs-header">
        <span className="blogs-label">Insights</span>
        <h2 className="blogs-title">Articles & Blogs</h2>
      </div>

      <div className="blogs-grid">
        {blogs.map((blog) => (
          <article
            key={blog.id}
            className="blog-card"
            onClick={() => navigate(`/blog/${blog.id}`)}
          >
            {blog.image_url && (
              <div className="blog-card-image">
                <img src={blog.image_url} alt={blog.title} />
              </div>
            )}
            <div className="blog-card-body">
              <div className="blog-card-top">
                <span className="blog-tag">{blog.tag}</span>
                <span className="blog-date">
                  {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="blog-card-title">{blog.title}</h3>
              <p className="blog-card-excerpt">{blog.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
