import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const leftMenus = [
  { label: 'Fabric', path: '/explore' },
  { label: 'Thread', path: '/explore' },
  { label: 'Blog', path: '/blog' },
];

const rightMenus = [
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'More', path: '/explore' },
];

export function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left links */}
        <ul className="navbar-side navbar-left">
          {leftMenus.map((item) => (
            <li key={item.label}>
              <button className="navbar-link" onClick={() => navigate(item.path)}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Center brand */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-text">FANAAR</span>
        </Link>

        {/* Right links */}
        <ul className="navbar-side navbar-right">
          {rightMenus.map((item) => (
            <li key={item.label}>
              <button className="navbar-link" onClick={() => navigate(item.path)}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button className="navbar-mobile-toggle" onClick={() => {
          const menu = document.querySelector('.navbar-mobile-menu');
          const overlay = document.querySelector('.navbar-mobile-overlay');
          if (menu) menu.classList.toggle('open');
          if (overlay) overlay.classList.toggle('open');
        }} aria-label="Toggle menu">
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* Mobile overlay */}
      <div className="navbar-mobile-overlay" onClick={() => {
        document.querySelector('.navbar-mobile-menu')?.classList.remove('open');
        document.querySelector('.navbar-mobile-overlay')?.classList.remove('open');
      }} />
      <div className="navbar-mobile-menu">
        {[...leftMenus, ...rightMenus].map((item) => (
          <button key={item.label} className="mobile-menu-item" onClick={() => {
            navigate(item.path);
            document.querySelector('.navbar-mobile-menu')?.classList.remove('open');
            document.querySelector('.navbar-mobile-overlay')?.classList.remove('open');
          }}>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
