import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { FabricArticle, FabricCategory } from '@/types/fabric';
import './ArticleGrid.css';

interface ArticleGridProps {
  category: FabricCategory;
  onArticleClick: (id: string) => void;
}

// Displays articles within a selected category
export function ArticleGrid({ category, onArticleClick }: ArticleGridProps) {
  // Fetch articles filtered by category
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', category],
    queryFn: async () => {
      const data = await api.articles.list({ category });
      return data as unknown as FabricArticle[];
    },
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="article-grid-loading">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="article-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-title" />
            <div className="skeleton-price" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!articles?.length) {
    return (
      <div className="article-grid-empty">
        <p>No articles found in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="article-grid">
      {articles.map((article) => (
        <button key={article.id} onClick={() => onArticleClick(article.id)} className="article-card">
          {/* Article image with out-of-stock badge */}
          <div className="article-image-wrap">
            {!article.in_stock && <span className="article-badge">Out of Stock</span>}
            {article.hero_image_url ? (
              <img src={article.hero_image_url} alt={article.name} className="article-image" loading="lazy" />
            ) : (
              <div className="article-placeholder">
                <span>{article.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Article name and price */}
          <h3 className="article-name">{article.name}</h3>
          <p className="article-price">AED {Number(article.price_aed).toFixed(2)}</p>
        </button>
      ))}
    </div>
  );
}
