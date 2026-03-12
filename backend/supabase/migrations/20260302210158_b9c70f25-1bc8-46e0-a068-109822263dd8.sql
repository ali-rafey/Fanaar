
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  tag TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blogs are publicly readable"
ON public.blogs FOR SELECT USING (true);

CREATE POLICY "Admins can manage blogs"
ON public.blogs FOR ALL
TO authenticated
USING (public.has_role('admin'::public.app_role, auth.uid()))
WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));

INSERT INTO public.blogs (title, excerpt, content, tag, image_url) VALUES
('The Art of Denim: From Cotton to Canvas', 
 'Explore how raw cotton is transformed into premium denim through our meticulous weaving and finishing process.',
 'Denim has been a cornerstone of textile manufacturing for over a century. At Fanaar Fabrics, our journey begins with carefully selected long-staple cotton, sourced from the finest growing regions. The cotton undergoes rigorous quality checks before entering our advanced spinning mills, where it is transformed into yarn of exceptional strength and consistency.

The weaving process is where the magic truly happens. Using our state-of-the-art looms, we create the signature twill weave that gives denim its characteristic diagonal ribbing. Each thread is precisely positioned to ensure uniform weight distribution and optimal drape.

Our finishing process involves multiple stages of washing, softening, and treatment to achieve the perfect hand-feel. Whether it''s raw selvedge or pre-washed comfort stretch, every meter of Fanaar denim tells a story of craftsmanship and precision.',
 'Fabric', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop'),

('Understanding GSM: A Buyer''s Guide',
 'What does GSM mean for your fabric choice? We break down weight, drape, and durability for every application.',
 'GSM — Grams per Square Meter — is one of the most critical specifications in textile purchasing. It directly influences how a fabric feels, drapes, and performs in its intended application.

Lightweight fabrics (under 150 GSM) are ideal for summer garments, linings, and delicate applications. They offer breathability and fluid drape but sacrifice durability.

Medium-weight fabrics (150-300 GSM) represent the sweet spot for most apparel applications. This range covers everything from dress shirts to casual trousers, offering a balance of comfort, structure, and longevity.

Heavyweight fabrics (above 300 GSM) are built for durability. Think workwear denim, canvas, and upholstery. These fabrics resist wear and maintain their shape over years of use.

At Fanaar, we help buyers select the optimal GSM for their specific needs, ensuring every purchase delivers exactly the performance required.',
 'Guide', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop'),

('Sustainable Textiles: Our Commitment',
 'How Fanaar Fabrics integrates eco-friendly practices from sourcing to sampling without compromising quality.',
 'Sustainability isn''t just a buzzword at Fanaar — it''s woven into every step of our process. From organic cotton sourcing to waterless dyeing technologies, we are committed to reducing our environmental footprint while maintaining the premium quality our clients expect.

Our water recycling systems recover and purify over 85% of the water used in our dyeing processes. Solar panels power a significant portion of our manufacturing facilities, and our waste management programs ensure that fabric offcuts find new life in recycled products.

We work exclusively with suppliers who share our commitment to ethical practices. Every raw material is traceable to its origin, ensuring fair labor practices and environmental responsibility throughout the supply chain.

The future of textiles is sustainable, and Fanaar is leading the way.',
 'Sustainability', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=500&fit=crop'),

('Twill vs Plain Weave: Choosing Right',
 'A detailed comparison of two foundational weave structures and when to use each for optimal results.',
 'The choice between twill and plain weave fundamentally shapes the character of a fabric. Understanding their differences is essential for making informed purchasing decisions.

Plain weave is the simplest and most common weave structure. Each weft thread alternates over and under each warp thread, creating a uniform, balanced fabric. Plain weaves are generally lighter, more breathable, and less expensive to produce. They''re ideal for shirts, blouses, and applications requiring a smooth, even surface.

Twill weave creates a distinctive diagonal pattern by passing the weft thread over multiple warp threads before going under one. This structure produces fabrics that are heavier, more durable, and have better drape. Denim, chinos, and suiting fabrics commonly use twill weaves.

At Fanaar, we produce both weave types across multiple fabric compositions, allowing buyers to select the perfect structure for their specific application.',
 'Education', 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=500&fit=crop');
