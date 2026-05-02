import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";

// Eager: landing page (Explore) — first paint route, keep in main chunk
import Explore from "./pages/Explore";

// Lazy: every other route — split into per-route chunks
const Categories = lazy(() => import("./pages/Categories"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const BlogListing = lazy(() => import("./pages/BlogListing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy admin: separate chunk; never loaded for public visitors
const AdminLayout = lazy(() =>
  import("@/components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminExtra = lazy(() => import("./pages/admin/AdminExtra"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div
    aria-busy="true"
    style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}
  />
);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname || "";
    if (path.startsWith("/123admin")) {
      setSplashDone(true);
      return;
    }
    if (window.sessionStorage.getItem("fanaar_splash_seen") === "1") {
      setSplashDone(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("fanaar_splash_seen", "1");
      } catch {
        // sessionStorage may be blocked (private mode); fail silently
      }
    }
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteFallback />}>
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
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
