import { useCallback, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Explore from "./pages/Explore";
import Categories from "./pages/Categories";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ArticleDetail from "./pages/ArticleDetail";
import BlogDetail from "./pages/BlogDetail";
import BlogListing from "./pages/BlogListing";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminExtra from "./pages/admin/AdminExtra";
import AdminSpecs from "./pages/admin/AdminSpecs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Start with splash visible; after mount we skip only for admin or returning visitors
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (path.startsWith('/123admin')) {
      setSplashDone(true);
      return;
    }
    if (window.sessionStorage.getItem('fanaar_splash_seen') === '1') {
      setSplashDone(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fanaar_splash_seen', '1');
    }
    setSplashDone(true);
  }, []);

  /* Splash screen on first load (client-side only) */
  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public pages — Explore is the landing page */}
            <Route path="/" element={<Explore />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:category" element={<Explore />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:category" element={<Categories />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<BlogListing />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin pages */}
            <Route path="/123admin" element={<AdminLogin />} />
            <Route path="/123admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="articles" element={<AdminArticles />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="extra" element={<AdminExtra />} />
              <Route path="specs" element={<AdminSpecs />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
