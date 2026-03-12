import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { FabricArticle, FabricSpecs } from '@/types/fabric';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // Fetch the article
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const data = await api.articles.get(id!);
      return data as unknown as FabricArticle | null;
    },
    enabled: !!id,
  });

  // Fetch technical specs for this article
  const { data: specs } = useQuery({
    queryKey: ['fabric-specs', id],
    queryFn: async () => {
      const data = await api.articles.getSpecs(id!);
      return data as unknown as FabricSpecs | null;
    },
    enabled: !!id,
  });

  const handleBack = () => {
    if (from) {
      navigate(from);
      return;
    }
    navigate(-1);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <MainLayout>
        <div className="article-loading">
          <div className="skeleton skeleton-hero" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-price" />
        </div>
      </MainLayout>
    );
  }

  // Not found
  if (!article) {
    return (
      <MainLayout>
        <div className="article-not-found">
          <p>Article not found</p>
          <button onClick={() => (from ? navigate(from) : navigate('/explore'))} className="article-not-found-btn">Back to Explore</button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="article-detail-page">

        {/* Back button */}
        <div className="article-back-section">
          <button className="article-back-btn" onClick={handleBack}>
            <ArrowLeft /> Back
          </button>
        </div>

        {/* Two-column layout: image + info */}
        <div className="article-detail-grid">

          {/* Left: hero image */}
          <div className="article-hero-wrap">
            <div className="article-hero-card">
              {article.hero_image_url ? (
                <img src={article.hero_image_url} alt={article.name} className="article-hero-img" />
              ) : (
                <div className="article-hero-placeholder">
                  <span>{article.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: article info */}
          <div className="article-info">

            {/* Category badge + stock status */}
            <div className="article-meta">
              <span className="article-badge">{article.category}</span>
              <div className={`article-stock ${article.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                {article.in_stock ? <><CheckCircle /><span>In Stock</span></> : <><XCircle /><span>Out of Stock</span></>}
              </div>
            </div>

            {/* Title */}
            <h1 className="article-title">{article.name}</h1>

            {/* Prices */}
            <div className="article-prices">
              <p className="article-price">AED {Number(article.price_aed).toFixed(2)}<span className="article-price-unit"> / meter</span></p>
              {article.price_usd != null && article.price_usd > 0 && (
                <p className="article-price">USD {Number(article.price_usd).toFixed(2)}<span className="article-price-unit"> / meter</span></p>
              )}
              {article.price_pkr != null && article.price_pkr > 0 && (
                <p className="article-price">PKR {Number(article.price_pkr).toFixed(0)}<span className="article-price-unit"> / meter</span></p>
              )}
            </div>

            {/* Description */}
            {article.description && <p className="article-description">{article.description}</p>}

            {/* Technical specs table */}
            {specs && (
              <div className="article-specs">
                <h2 className="article-specs-title">Technical Specifications</h2>
                <div className="specs-grid">
                  <div className="spec-item"><span className="spec-label">GSM</span><span className="spec-value">{specs.gsm} g/m²</span></div>
                  <div className="spec-item"><span className="spec-label">Tear Strength</span><span className="spec-value">{specs.tear_strength}</span></div>
                  <div className="spec-item"><span className="spec-label">Tensile Strength</span><span className="spec-value">{specs.tensile_strength}</span></div>
                  <div className="spec-item"><span className="spec-label">Dye Class</span><span className="spec-value">{specs.dye_class}</span></div>
                  <div className="spec-item"><span className="spec-label">Thread Count</span><span className="spec-value">{specs.thread_count}</span></div>
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="article-cta">
              <h3 className="article-cta-title">Interested in this fabric?</h3>
              <p className="article-cta-text">Contact us for samples, bulk pricing, or custom requirements</p>
              <button onClick={() => navigate('/contact')} className="article-cta-btn">Request Information</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
