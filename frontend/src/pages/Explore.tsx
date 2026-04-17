import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryGrid } from '@/components/shop/CategoryGrid';
import { ArticleGrid } from '@/components/shop/ArticleGrid';
import { BlogsSection } from '@/components/shop/BlogsSection';
import { ProcessSection } from '@/components/shop/ProcessSection';
import { ArrowLeft } from 'lucide-react';
import { getCategoryInfo } from '@/types/fabric';
import './Explore.css';

export default function Explore() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryInfo = category ? getCategoryInfo(category) : null;

  // Restore scroll when returning from category articles page or blog detail.
  // Must run when we switch to main view (category becomes undefined), not only on mount.
  // Explore page scrolls the window (document), so we use window.scrollY / window.scrollTo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (category) return; // On category page; restore only when showing main Explore view

    const returnToCategories = window.sessionStorage.getItem('explore_return_to_categories');
    const stored = window.sessionStorage.getItem('explore_scroll_y');
    const offset = stored ? parseFloat(stored) : NaN;
    const hasValidOffset = !Number.isNaN(offset) && offset >= 0;

    if (!hasValidOffset) return;

    window.sessionStorage.removeItem('explore_return_to_categories');
    window.sessionStorage.removeItem('explore_scroll_y');

    const restoreScroll = () => {
      window.scrollTo({ top: offset, behavior: 'instant' as ScrollBehavior });
    };
    requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
  }, [category]);

  const { data: homeData } = useQuery({
    queryKey: ['home-page'],
    queryFn: async () => api.home.load(),
    enabled: !category,
    staleTime: 5 * 60 * 1000,
  });

  const heroMediaUrl = (homeData?.hero_media?.value || homeData?.hero_video_url || '').trim();
  const heroMediaType = (homeData?.hero_media?.media_type || '').trim();
  const heroFallbackImageUrl = (homeData?.hero_image_url || '').trim();
  const heroType =
    heroMediaType === 'video'
      ? 'video'
      : heroMediaType === 'image'
        ? 'image'
        : heroMediaUrl.endsWith('.mp4') || heroMediaUrl.endsWith('.webm')
          ? 'video'
          : 'image';
  const heroVideoUrl = heroType === 'video' ? heroMediaUrl : '';
  const heroImageUrl = heroType === 'image' ? (heroMediaUrl || heroFallbackImageUrl) : heroFallbackImageUrl;
  const heroFocusX = Math.min(100, Math.max(0, parseFloat(homeData?.hero_video_focus_x ?? '50')));
  const heroFocusY = Math.min(100, Math.max(0, parseFloat(homeData?.hero_video_focus_y ?? '50')));

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroVideoErrored, setHeroVideoErrored] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  useEffect(() => {
    setHeroVideoErrored(false);
    setHeroVideoReady(false);
  }, [heroVideoUrl]);

  useEffect(() => {
    if (heroType !== 'video' || !heroVideoUrl || !heroVideoRef.current || heroVideoErrored) return;
    const video = heroVideoRef.current;
    video.muted = true;
    const attemptPlay = async () => {
      try {
        await video.play();
      } catch {
        video.muted = true;
        video.play().catch(() => {});
      }
    };
    attemptPlay();
  }, [heroType, heroVideoErrored, heroVideoUrl]);

  // If a category is selected, show that category page
  if (category && categoryInfo) {
    return (
      <MainLayout>
        <div className="explore-page">
          <section className="explore-cat-header">
            <div className="explore-cat-header-inner">
              <button
                type="button"
                className="explore-back-btn"
                onClick={() => navigate('/explore')}
                aria-label="Back to categories"
              >
                <ArrowLeft />
              </button>
              <div>
                <span className="explore-label">Category</span>
                <h1 className="explore-cat-title">{categoryInfo?.name}</h1>
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
    <MainLayout overlayNav>
      <section className="snap-section explore-hero">
        <div className="explore-hero-media">
          {heroVideoUrl || heroImageUrl ? (
            heroVideoUrl && !heroVideoErrored ? (
              <>
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Hero"
                    className="explore-hero-poster"
                    fetchPriority="high"
                  />
                ) : null}
                <video
                  ref={heroVideoRef}
                  src={heroVideoUrl}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  poster={heroImageUrl || undefined}
                  crossOrigin="anonymous"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  className="explore-hero-video"
                  onLoadedData={() => setHeroVideoReady(true)}
                  onCanPlay={() => setHeroVideoReady(true)}
                  onError={() => setHeroVideoErrored(true)}
                  style={{
                    opacity: heroVideoReady ? 1 : 0,
                    ['--hero-focus-x' as any]: `${heroFocusX}%`,
                    ['--hero-focus-y' as any]: `${heroFocusY}%`,
                  }}
                />
              </>
            ) : (
              <img src={heroImageUrl} alt="Hero" className="explore-hero-img" fetchPriority="high" />
            )
          ) : (
            <div className="explore-hero-fallback" />
          )}
          <div className="explore-hero-overlay" />
        </div>
        <div className="explore-hero-content">
          <span className="explore-hero-label">Premium Textiles</span>
          <h1 className="explore-hero-title">Crafted for Excellence</h1>
          <p className="explore-hero-desc">Discover fabrics that define quality, precision, and luxury.</p>
          <div className="explore-scroll-hint">
            <span>Scroll to explore</span>
            <div className="explore-scroll-line" />
          </div>
        </div>
      </section>

      <section className="snap-section explore-process-section">
        <ProcessSection processSection={homeData?.process_section || undefined} />
      </section>

      <section className="snap-section explore-categories-section">
        <div className="explore-categories-inner">
          <div className="explore-section-header">
            <span className="explore-label">Our Collection</span>
            <h2 className="explore-section-title">Browse by Category</h2>
          </div>
          <CategoryGrid
            categories={homeData?.categories || undefined}
            onCategorySelect={(cat) => {
              const scrollY = window.scrollY;
              window.sessionStorage.setItem('explore_scroll_y', String(scrollY));
              window.sessionStorage.setItem('explore_return_to_categories', '1');
              navigate(`/explore/${cat}`);
            }}
            limit={3}
          />
        </div>
      </section>

      <section className="snap-section explore-blogs-section">
        <BlogsSection blogs={homeData?.blogs || undefined} />
      </section>
    </MainLayout>
  );
}
