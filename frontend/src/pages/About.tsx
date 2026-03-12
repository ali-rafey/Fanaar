import { MainLayout } from '@/components/layout/MainLayout';
import './About.css';

/* Stats displayed in the about page */
const stats = [
  { number: '60+', label: 'Years of Excellence' },
  { number: '500+', label: 'Fabric Varieties' },
  { number: '40+', label: 'Countries Served' },
];

/* Manufacturing process highlights */
const processes = [
  { title: 'Quality Testing', desc: 'Every batch tested for GSM, tear strength, and tensile durability' },
  { title: 'Color Mastery', desc: 'Advanced dyeing with Reactive, VAT, and Indanthrene processes' },
  { title: 'Sustainable Practices', desc: 'Water recycling and eco-friendly dye solutions' },
  { title: 'Custom Development', desc: 'Bespoke fabric creation for your unique requirements' },
];

export default function About() {
  return (
    <MainLayout snap>
      {/* ===== Section 1: Hero ===== */}
      <section className="snap-section about-hero-section">
        <div className="about-hero-bg" />
        <div className="about-hero-content">
          <span className="about-label">About Us</span>
          <h1 className="about-hero-title">Crafted with Heritage</h1>
          <p className="about-hero-subtitle">Three generations of excellence in textile manufacturing</p>
        </div>
      </section>

      {/* ===== Section 2: Story + Stats ===== */}
      <section className="snap-section about-story-section">
        <div className="about-story-inner">
          <div className="story-block">
            <span className="about-label">Our Story</span>
            <h2 className="about-section-title">A Legacy of Quality</h2>
            <p className="about-text">
              Founded in 1962, our mill has been at the forefront of textile innovation for over six decades.
              What began as a small family operation has grown into one of the region's most respected fabric
              manufacturers, serving prestigious fashion houses and garment makers worldwide.
            </p>
          </div>

          {/* Stats cards */}
          <div className="about-stats-grid">
            {stats.map((stat, i) => (
              <div key={stat.label} className="about-stat-card" style={{ animationDelay: `${i * 150}ms` }}>
                <span className="about-stat-number">{stat.number}</span>
                <p className="about-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 3: Process ===== */}
      <section className="snap-section about-process-section">
        <div className="about-process-inner">
          <div className="about-process-header">
            <span className="about-label">Our Process</span>
            <h2 className="about-section-title">From Fiber to Fabric</h2>
            <p className="about-text">
              Every bolt of fabric undergoes rigorous quality testing. Our in-house lab conducts
              comprehensive GSM verification, tear and tensile strength testing, and colorfastness evaluation.
            </p>
          </div>
          <div className="about-process-grid">
            {processes.map((item, i) => (
              <div key={item.title} className="about-process-card" style={{ animationDelay: `${i * 100}ms` }}>
                <h3 className="about-process-title">{item.title}</h3>
                <p className="about-process-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
