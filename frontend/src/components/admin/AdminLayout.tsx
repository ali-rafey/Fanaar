import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAuthToken, setAuthToken } from '@/api/client';
import { FileText, FolderOpen, LayoutDashboard, LogOut, Menu, Package, Sliders, X } from 'lucide-react';
import './AdminLayout.css';

interface AdminHeaderState {
  title: string;
  actions?: React.ReactNode;
}

interface AdminHeaderContextValue {
  setHeader: (next: AdminHeaderState) => void;
}

export function useAdminHeader(title: string, actions?: React.ReactNode, deps: readonly unknown[] = []) {
  const { setHeader } = useOutletContext<AdminHeaderContextValue>();

  useLayoutEffect(() => {
    setHeader({ title, actions });
    return () => {
      setHeader({ title: 'Admin', actions: undefined });
    };
  }, [setHeader, title, ...deps]);
}

const defaultTitles: Record<string, string> = {
  '/123admin/articles': 'Articles',
  '/123admin/blogs': 'Blogs',
  '/123admin/categories': 'Categories',
  '/123admin/dashboard': 'Dashboard',
  '/123admin/extra': 'Extra',
};

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [header, setHeader] = useState<AdminHeaderState>({
    title: defaultTitles[location.pathname] || 'Admin',
  });

  const sessionQuery = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => api.admin.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  const clearSession = () => {
    setAuthToken(null);
    queryClient.removeQueries({ queryKey: ['admin-session'] });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sessionQuery.isSuccess || sessionQuery.data?.isAdmin) return;
    clearSession();
    navigate('/123admin', { replace: true });
  }, [navigate, sessionQuery.data, sessionQuery.isSuccess]);

  useEffect(() => {
    if (!sessionQuery.isError) return;
    const status = (sessionQuery.error as { status?: number }).status;
    if (status === 401 || status === 403 || !getAuthToken()) {
      clearSession();
      navigate('/123admin', { replace: true });
    }
  }, [navigate, sessionQuery.error, sessionQuery.isError]);

  const handleLogout = async () => {
    try {
      await api.admin.signOut();
    } catch (_) {
      // Best effort sign-out: local session is still cleared below.
    }
    clearSession();
    navigate('/123admin', { replace: true });
  };

  const navItems = [
    { path: '/123admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/123admin/articles', label: 'Articles', icon: Package },
    { path: '/123admin/blogs', label: 'Blogs', icon: FileText },
    { path: '/123admin/categories', label: 'Categories', icon: FolderOpen },
    { path: '/123admin/extra', label: 'Extra', icon: Sliders },
  ];

  const authStatus = (sessionQuery.error as { status?: number } | null)?.status;
  const hasStoredSession = !!getAuthToken();
  const isBlockingAuthCheck =
    sessionQuery.isPending || (!sessionQuery.data?.isAdmin && !hasStoredSession && !sessionQuery.isError);

  if (isBlockingAuthCheck) {
    return (
      <div className="admin-layout admin-layout--state">
        <div className="admin-state-card">Loading admin workspace…</div>
      </div>
    );
  }

  if (sessionQuery.isError && (authStatus === 401 || authStatus === 403 || !hasStoredSession)) {
    return (
      <div className="admin-layout admin-layout--state">
        <div className="admin-state-card">Redirecting to sign in…</div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <header className="admin-mobile-header">
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
        <h1 className="admin-mobile-brand">Fanaar Control</h1>
      </header>

      {mobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <h1 className="admin-sidebar-title">Fanaar</h1>
          <span className="admin-sidebar-subtitle">Private Workspace</span>
        </div>

        <nav className="admin-sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
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
          <h1 className="admin-header-title">{header.title}</h1>
          {header.actions ? <div className="admin-header-actions">{header.actions}</div> : null}
        </header>
        <div className="admin-content">
          <Outlet context={{ setHeader }} />
        </div>
      </main>
    </div>
  );
}
