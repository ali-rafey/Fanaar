import { useEffect, useRef } from 'react';
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

  const { data: heroSettings } = useQuery({
    queryKey: ['site-settings-hero'],
    queryFn: async () => {
      const data = await api.settings.list([
        'hero_media',
        'hero_video_muted',
        'hero_video_url',
        'hero_image_url',
        'hero_video_focus_x',
        'hero_video_focus_y',
      ]);
      return data || [];
    },
  });

  const heroMedia = heroSettings?.find((s: any) => s.key === 'hero_media');
  const heroVideoMutedSetting = heroSettings?.find((s: any) => s.key === 'hero_video_muted');
  const heroVideoUrlSetting = heroSettings?.find((s: any) => s.key === 'hero_video_url');
  const heroImageUrlSetting = heroSettings?.find((s: any) => s.key === 'hero_image_url');
  const heroFocusXSetting = heroSettings?.find((s: any) => s.key === 'hero_video_focus_x');
  const heroFocusYSetting = heroSettings?.find((s: any) => s.key === 'hero_video_focus_y');

  const legacyHeroUrl = (heroMedia?.value || '').trim();
  const legacyHeroType = (heroMedia?.media_type || '').trim();
  const legacyHeroMuted = heroVideoMutedSetting?.value !== '0';

  const explicitVideoUrl = (heroVideoUrlSetting?.value || '').trim();
  const explicitImageUrl = (heroImageUrlSetting?.value || '').trim();

  const heroUrl = legacyHeroUrl || explicitVideoUrl || explicitImageUrl;
  const inferredType = legacyHeroType || (explicitVideoUrl ? 'video' : (explicitImageUrl ? 'image' : 'image'));
  const heroType = inferredType || (heroUrl?.endsWith('.mp4') ? 'video' : 'image');
  const heroMuted = legacyHeroMuted ?? true;

  const heroFocusX = Math.min(100, Math.max(0, parseFloat(heroFocusXSetting?.value ?? '50')));
  const heroFocusY = Math.min(100, Math.max(0, parseFloat(heroFocusYSetting?.value ?? '50')));

  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays as soon as it can (autoPlay handles most cases; this is fallback)
  useEffect(() => {
    if (heroType !== 'video' || !heroUrl || !heroVideoRef.current) return;
    const video = heroVideoRef.current;
    video.muted = heroMuted;
    const attemptPlay = async () => {
      try {
        await video.play();
      } catch {
        video.muted = true;
        video.play().catch(() => {});
      }
    };
    attemptPlay();
  }, [heroUrl, heroType, heroMuted]);

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
          {heroUrl ? (
            heroType === 'video' ? (
              <video
                ref={heroVideoRef}
                src={heroUrl}
                muted={heroMuted}
                loop
                playsInline
                autoPlay
                preload="auto"
                crossOrigin="anonymous"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="explore-hero-video"
                style={{
                  ['--hero-focus-x' as any]: `${heroFocusX}%`,
                  ['--hero-focus-y' as any]: `${heroFocusY}%`,
                }}
              />
            ) : (
              <img src={heroUrl} alt="Hero" className="explore-hero-img" />
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
        <ProcessSection />
      </section>

      <section className="snap-section explore-categories-section">
        <div className="explore-categories-inner">
          <div className="explore-section-header">
            <span className="explore-label">Our Collection</span>
            <h2 className="explore-section-title">Browse by Category</h2>
          </div>
          <CategoryGrid
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
        <BlogsSection />
      </section>
    </MainLayout>
  );
}
