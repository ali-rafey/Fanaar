import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 3000);
    const done = setTimeout(() => onComplete(), 3900);
    return () => { clearTimeout(timer); clearTimeout(done); };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-mark" aria-hidden="true">
          <span className="splash-arabic-shadow">فنار</span>
          <span className="splash-arabic" lang="ar" dir="rtl">فنار</span>
        </div>
        <div className="splash-caption-wrap">
          <p className="splash-subtitle">FANAAR FABRICS</p>
          <div className="splash-line" />
        </div>
      </div>
    </div>
  );
}
