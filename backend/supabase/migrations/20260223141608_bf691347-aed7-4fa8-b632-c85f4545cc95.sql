
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create fabric_category enum
CREATE TYPE public.fabric_category AS ENUM ('denim', 'cotton', 'twill', 'linen', 'silk', 'wool', 'synthetic');

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_aed NUMERIC NOT NULL,
  price_usd NUMERIC,
  price_pkr NUMERIC,
  hero_image_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fabric_specs table
CREATE TABLE public.fabric_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  gsm INTEGER NOT NULL,
  tear_strength TEXT NOT NULL,
  tensile_strength TEXT NOT NULL,
  dye_class TEXT NOT NULL,
  thread_count TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id)
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabric_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read policies for categories, articles, fabric_specs
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Articles are publicly readable" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Fabric specs are publicly readable" ON public.fabric_specs FOR SELECT USING (true);

-- Admin write policies using has_role function
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Admin policies for categories
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.has_role('admin', auth.uid()));

-- Admin policies for articles
CREATE POLICY "Admins can insert articles" ON public.articles FOR INSERT WITH CHECK (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can update articles" ON public.articles FOR UPDATE USING (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can delete articles" ON public.articles FOR DELETE USING (public.has_role('admin', auth.uid()));

-- Admin policies for fabric_specs
CREATE POLICY "Admins can insert fabric_specs" ON public.fabric_specs FOR INSERT WITH CHECK (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can update fabric_specs" ON public.fabric_specs FOR UPDATE USING (public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can delete fabric_specs" ON public.fabric_specs FOR DELETE USING (public.has_role('admin', auth.uid()));

-- User roles policies
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role('admin', auth.uid()));

-- Create storage bucket for fabric images
INSERT INTO storage.buckets (id, name, public) VALUES ('fabric-images', 'fabric-images', true);

-- Storage policies
CREATE POLICY "Fabric images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'fabric-images');
CREATE POLICY "Admins can upload fabric images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fabric-images' AND public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can update fabric images" ON storage.objects FOR UPDATE USING (bucket_id = 'fabric-images' AND public.has_role('admin', auth.uid()));
CREATE POLICY "Admins can delete fabric images" ON storage.objects FOR DELETE USING (bucket_id = 'fabric-images' AND public.has_role('admin', auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
