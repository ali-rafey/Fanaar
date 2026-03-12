
-- Site settings for hero media and other admin-configurable content
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  media_type text DEFAULT 'image',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public site)
CREATE POLICY "Site settings are publicly readable"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert site_settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can update site_settings"
ON public.site_settings FOR UPDATE
USING (has_role('admin'::app_role, auth.uid()));

CREATE POLICY "Admins can delete site_settings"
ON public.site_settings FOR DELETE
USING (has_role('admin'::app_role, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default hero setting
INSERT INTO public.site_settings (key, value, media_type)
VALUES ('hero_media', NULL, 'image');
