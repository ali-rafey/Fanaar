import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { FabricCategory, Category, getCategoryInfo } from '@/types/fabric';
import './CategoryGrid.css';

interface CategoryGridProps {
  onCategorySelect: (category: FabricCategory) => void;
  /** Limit number of categories shown (for homepage) */
  limit?: number;
  categories?: Category[];
}

/* Displays fabric categories as portrait cards */
export function CategoryGrid({ onCategorySelect, limit, categories: initialCategories }: CategoryGridProps) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.categories.list();
      return data as Category[];
    },
    enabled: !initialCategories,
    initialData: initialCategories,
  });

  /* Apply limit if provided */
  const displayCategories = limit ? categories.slice(0, limit) : categories;

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="category-grid">
        {[...Array(limit || 6)].map((_, i) => (
          <div key={i} className="category-card category-skeleton">
            <div className="category-image-wrap skeleton-shimmer" />
            <div className="skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="category-grid">
      {displayCategories.map((category, i) => {
        const info = getCategoryInfo(category.name, category.image_url);
        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.name.toLowerCase())}
            className="category-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Category image with gradient overlay */}
            <div className="category-image-wrap">
              <div className="category-image-overlay" />
              {info.image ? (
                <img src={info.image} alt={info.name} className="category-image" loading="lazy" />
              ) : (
                <div className="category-placeholder">
                  <span>{info.name.charAt(0)}</span>
                </div>
              )}
              {/* Name inside the card */}
              <div className="category-name-overlay">
                <h3 className="category-name">{info.name}</h3>
                <p className="category-desc">{info.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
