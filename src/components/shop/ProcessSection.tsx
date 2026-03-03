import { useState, useEffect, useRef, useCallback } from 'react';
import './ProcessSection.css';

const steps = [
  {
    key: 'sourcing',
    title: 'Sourcing',
    subtitle: 'The Foundation',
    description:
      'We source only the finest raw materials from trusted suppliers around the globe. Every fibre is hand-selected for its strength, texture, and purity — ensuring the foundation of every fabric meets our uncompromising standards.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop',
  },
  {
    key: 'purpose',
    title: 'Purpose',
    subtitle: 'Design Intent',
    description:
      "Each fabric is designed with a clear purpose. Whether it's for high-fashion garments, industrial applications, or everyday wear, we engineer every thread to serve its intended function with excellence.",
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=800&fit=crop',
  },
  {
    key: 'testing',
    title: 'Testing',
    subtitle: 'Quality Assurance',
    description:
      'Rigorous laboratory testing ensures every roll meets international quality benchmarks. From tensile strength to colour fastness, every parameter is measured, documented, and verified before production.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=800&fit=crop',
  },
  {
    key: 'sampling',
    title: 'Sampling',
    subtitle: 'Final Validation',
    description:
      'Before full-scale production, our sampling process allows clients to feel, test, and approve the fabric. This ensures complete satisfaction and alignment with your specifications and vision.',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=800&fit=crop',
  },
];

export function ProcessSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animDir, setAnimDir] = useState<'up' | 'down'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const accumulatorRef = useRef(0);

  const THRESHOLD = 60;

  const goTo = useCallback((next: number, dir: 'up' | 'down') => {
    if (lockRef.current) return;
    lockRef.current = true;
    setAnimDir(dir);
    setActiveIndex(next);
    accumulatorRef.current = 0;
    setTimeout(() => { lockRef.current = false; }, 900);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (lockRef.current) { e.preventDefault(); return; }

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeIndex + direction;

      if (nextIndex >= 0 && nextIndex < steps.length) {
        e.preventDefault();
        accumulatorRef.current += Math.abs(e.deltaY);
        if (accumulatorRef.current >= THRESHOLD) {
          goTo(nextIndex, direction > 0 ? 'down' : 'up');
        }
      } else {
        accumulatorRef.current = 0;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (lockRef.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 40) return;

      const direction = diff > 0 ? 1 : -1;
      const nextIndex = activeIndex + direction;

      if (nextIndex >= 0 && nextIndex < steps.length) {
        e.preventDefault();
        goTo(nextIndex, direction > 0 ? 'down' : 'up');
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeIndex, goTo]);

  const current = steps[activeIndex];

  return (
    <div className="process-container" ref={containerRef}>
      {/* Left: Text content */}
      <div className="process-text-col">
        <div className="process-indicators">
          {steps.map((step, i) => (
            <button
              key={step.key}
              className={`process-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => {
                const dir = i > activeIndex ? 'down' : 'up';
                goTo(i, dir);
              }}
              aria-label={step.title}
            />
          ))}
        </div>

        <div className={`process-text-content process-anim-${animDir}`} key={current.key}>
          <span className="process-step-label">
            {String(activeIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
          <span className="process-subtitle">{current.subtitle}</span>
          <h2 className="process-title">{current.title}</h2>
          <p className="process-desc">{current.description}</p>
        </div>
      </div>

      {/* Right: Square image centered */}
      <div className="process-image-col">
        {steps.map((step, i) => (
          <img
            key={step.key}
            src={step.image}
            alt={step.title}
            className={`process-image ${i === activeIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
