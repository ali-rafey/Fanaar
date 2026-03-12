import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '@/api/client';
import { LayoutDashboard, Package, LogOut, FolderOpen, Sliders, Menu, X, FileText } from 'lucide-react';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, actions }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.admin.me();
      if (!data?.isAdmin) {
        setAuthToken(null);
        navigate('/123admin');
        return;
      }
      setLoading(false);
    } catch (_) {
      setAuthToken(null);
      navigate('/123admin');
    }
  };

  const handleLogout = async () => {
    try { await api.admin.signOut(); } catch (_) {}
    setAuthToken(null);
    navigate('/123admin');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/123admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/123admin/blogs', label: 'Blogs', icon: FileText },
    { path: '/123admin/categories', label: 'Categories', icon: FolderOpen },
    { path: '/123admin/extra', label: 'Extra', icon: Sliders },
  ];

  if (loading) {
    return <div className="admin-layout">Loading...</div>;
  }

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
        <h1 className="admin-mobile-brand">Admin Panel</h1>
      </header>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <h1 className="admin-sidebar-title">Fabric Mill</h1>
          <span className="admin-sidebar-subtitle">Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <item.icon />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-header-title">{title}</h1>
          {actions && <div className="admin-header-actions">{actions}</div>}
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
