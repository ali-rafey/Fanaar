import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2000);
    const done = setTimeout(() => onComplete(), 2600);
    return () => { clearTimeout(timer); clearTimeout(done); };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <h1 className="splash-title">FANAAR</h1>
        <div className="splash-line" />
        <p className="splash-subtitle">FABRICS</p>
      </div>
    </div>
  );
}
