import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import './ProcessSection.css';

interface ProcessSectionEntry {
  image?: string;
}

const defaultSteps = [
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

interface ProcessSectionProps {
  processSection?: ProcessSectionEntry[];
}

export function ProcessSection({ processSection: initialProcessSection }: ProcessSectionProps) {
  const { data: processSection } = useQuery({
    queryKey: ['process-section'],
    queryFn: async () => {
      const data = await api.settings.list(['process_section']);
      const value = (data || []).find((r: any) => r.key === 'process_section')?.value;
      if (!value) return [];
      try {
        return JSON.parse(value) as ProcessSectionEntry[];
      } catch {
        return [];
      }
    },
    enabled: !initialProcessSection,
    initialData: initialProcessSection,
  });

  const steps = useMemo(() => {
    return defaultSteps.map((step, i) => ({
      ...step,
      image: processSection?.[i]?.image || step.image,
    }));
  }, [processSection]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [animDir, setAnimDir] = useState<'left' | 'right'>('left');
  const current = steps[activeIndex];

  return (
    <div className={`process-container anim-${animDir}`}>
      <div className="process-text-col">
        <div className="process-indicators">
          {steps.map((step, i) => (
            <button
              key={step.key}
              className={`process-dot ${i <= activeIndex ? 'filled' : ''} ${i === activeIndex ? 'current' : ''}`}
              onClick={() => {
                if (i === activeIndex) return;
                setAnimDir(i > activeIndex ? 'left' : 'right');
                setActiveIndex(i);
              }}
              aria-label={step.title}
            />
          ))}
        </div>

        <div className="process-text-content" key={current.key}>
          <span className="process-step-label">
            {String(activeIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
          <span className="process-subtitle">{current.subtitle}</span>
          <h2 className="process-title">{current.title}</h2>
          <p className="process-desc">{current.description}</p>
        </div>
      </div>

      <div className="process-image-col">
        {steps.map((step, i) => (
          <img
            key={step.key}
            src={step.image}
            alt={step.title}
            className={`process-image ${i === activeIndex ? 'active' : ''}`}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}
