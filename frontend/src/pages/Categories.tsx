import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryGrid } from '@/components/shop/CategoryGrid';
import { ArticleGrid } from '@/components/shop/ArticleGrid';
import { ArrowLeft } from 'lucide-react';
import { getCategoryInfo } from '@/types/fabric';
import './Categories.css';
import './Explore.css';

export default function Categories() {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const location = useLocation();
  const categoryInfo = category ? getCategoryInfo(category) : null;

  // Category articles view: /categories/cotton etc. Back goes to /categories.
  if (category && categoryInfo) {
    return (
      <MainLayout>
        <div className="explore-page">
          <section className="explore-cat-header">
            <div className="explore-cat-header-inner">
              <button
                type="button"
                className="explore-back-btn"
                onClick={() => navigate('/categories')}
                aria-label="Back to categories"
              >
                <ArrowLeft />
              </button>
              <div>
                <span className="explore-label">Category</span>
                <h1 className="explore-cat-title">{categoryInfo.name}</h1>
              </div>
            </div>
          </section>

          <section className="explore-cat-content">
            <div className="explore-cat-content-inner">
              <ArticleGrid
                category={category}
                onArticleClick={(id) => navigate(`/article/${id}`, { state: { from: location.pathname } })}
              />
            </div>
          </section>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="categories-page">
        <header className="categories-header">
          <div className="categories-header-inner">
            <button
              type="button"
              className="explore-back-btn"
              onClick={() => navigate('/explore')}
              aria-label="Back to explore"
            >
              <ArrowLeft />
            </button>
            <div>
              <span className="categories-label">Fabric</span>
              <h1 className="categories-title">All Categories</h1>
            </div>
          </div>
          <p className="categories-desc">
            Browse our full range of fabric categories and dive into detailed articles for each type.
          </p>
        </header>

        <section className="categories-grid-section">
          <CategoryGrid onCategorySelect={(cat) => navigate(`/categories/${cat}`)} />
        </section>
      </div>
    </MainLayout>
  );
}

