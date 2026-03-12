import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { FabricArticle } from '@/types/fabric';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './BestArticlesCarousel.css';

interface Props {
  onArticleClick: (id: string) => void;
}

/* Horizontal carousel of best-selling / latest articles */
export function BestArticlesCarousel({ onArticleClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  /* Fetch latest articles as "best sellers" */
  const { data: articles = [] } = useQuery({
    queryKey: ['best-articles'],
    queryFn: async () => {
      const data = await api.articles.list({ in_stock: true, limit: 12 });
      return data as unknown as FabricArticle[];
    },
  });

  /* Update scroll button visibility */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [articles]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!articles.length) return null;

  return (
    <div className="carousel-section">
      {/* Section header */}
      <div className="carousel-header">
        <div>
          <span className="carousel-label">Curated Selection</span>
          <h2 className="carousel-title">Best Sellers</h2>
        </div>
        <div className="carousel-arrows">
          <button className="carousel-arrow" onClick={() => scroll('left')} disabled={!canScrollLeft}>
            <ChevronLeft />
          </button>
          <button className="carousel-arrow" onClick={() => scroll('right')} disabled={!canScrollRight}>
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div className="carousel-track" ref={scrollRef} onScroll={checkScroll}>
        {articles.map((article, i) => (
          <button
            key={article.id}
            className="carousel-card"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => onArticleClick(article.id)}
          >
            <div className="carousel-img-wrap">
              {article.hero_image_url ? (
                <img src={article.hero_image_url} alt={article.name} className="carousel-img" loading="lazy" />
              ) : (
                <div className="carousel-placeholder">
                  <span>{article.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="carousel-card-name">{article.name}</h3>
            <p className="carousel-card-price">AED {Number(article.price_aed).toFixed(2)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
