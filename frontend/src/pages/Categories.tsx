import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryGrid } from '@/components/shop/CategoryGrid';
import './Categories.css';

export default function Categories() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="categories-page">
        <header className="categories-header">
          <span className="categories-label">Fabric</span>
          <h1 className="categories-title">All Categories</h1>
          <p className="categories-desc">
            Browse our full range of fabric categories and dive into detailed articles for each type.
          </p>
        </header>

        <section className="categories-grid-section">
          <CategoryGrid onCategorySelect={(cat) => navigate(`/explore/${cat}`)} />
        </section>
      </div>
    </MainLayout>
  );
}

