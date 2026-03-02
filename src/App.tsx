import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ArticleDetail from "./pages/ArticleDetail";
import BlogDetail from "./pages/BlogDetail";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminSpecs from "./pages/admin/AdminSpecs";
import AdminCategories from "./pages/admin/AdminCategories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  /* Splash screen on first load */
  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* Public pages — Explore is the landing page */}
            <Route path="/" element={<Explore />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:category" element={<Explore />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin pages */}
            <Route path="/123admin" element={<AdminLogin />} />
            <Route path="/123admin/dashboard" element={<AdminDashboard />} />
            <Route path="/123admin/articles" element={<AdminArticles />} />
            <Route path="/123admin/categories" element={<AdminCategories />} />
            <Route path="/123admin/specs" element={<AdminSpecs />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
