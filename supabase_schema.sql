-- ==============================================================================
-- SUPABASE DATABASE MIGRATION & RLS POLICIES
-- Portfolio CMS for Marwan Bouhamid
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- Profile Table
CREATE TABLE IF NOT EXISTS public.profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Marwan Bouhamid',
  title_en TEXT NOT NULL DEFAULT 'Full-Stack Web Developer',
  title_fr TEXT NOT NULL DEFAULT 'Développeur Web Full-Stack',
  title_ar TEXT NOT NULL DEFAULT 'مطور ويب شامل (Full-Stack)',
  tagline_en TEXT DEFAULT 'Make something good from you',
  tagline_fr TEXT DEFAULT 'Make something good from you',
  tagline_ar TEXT DEFAULT 'Make something good from you',
  bio_en_p1 TEXT,
  bio_en_p2 TEXT,
  bio_fr_p1 TEXT,
  bio_fr_p2 TEXT,
  bio_ar_p1 TEXT,
  bio_ar_p2 TEXT,
  photo_url TEXT DEFAULT 'assets/images/profile.jpg',
  cv_url TEXT DEFAULT 'assets/Marwan_Bouhamid_CV.pdf',
  email TEXT DEFAULT 'marwanbouhamid123@gmail.com',
  phone TEXT DEFAULT '0645905095',
  whatsapp TEXT DEFAULT '212645905095',
  location_en TEXT DEFAULT 'Tanger, Morocco',
  location_fr TEXT DEFAULT 'Tanger, Maroc',
  location_ar TEXT DEFAULT 'طنجة، المغرب',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Links Table
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills Table (NO percentage bars per specification)
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('backend', 'frontend', 'tools', 'basic')),
  level_label TEXT,
  icon_svg TEXT,
  in_marquee BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fullstack', 'frontend', 'api')),
  category_label_en TEXT,
  category_label_fr TEXT,
  category_label_ar TEXT,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  detailed_overview_en TEXT,
  detailed_overview_fr TEXT,
  detailed_overview_ar TEXT,
  image_url TEXT NOT NULL,
  fallback_image_url TEXT,
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates Table (Display "Verified" ONLY if verify_url is not null and not empty)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year TEXT NOT NULL,
  image_url TEXT NOT NULL,
  fallback_image_url TEXT,
  verify_url TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Messages Table (Protected inbox, public insert with length restrictions)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 255),
  subject TEXT NOT NULL CHECK (char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) <= 3000),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_status_order ON public.projects (status, sort_order);
CREATE INDEX IF NOT EXISTS idx_skills_cat_order ON public.skills (category, sort_order);
CREATE INDEX IF NOT EXISTS idx_certificates_order ON public.certificates (sort_order);
CREATE INDEX IF NOT EXISTS idx_social_links_order ON public.social_links (sort_order);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON public.contact_messages (read, created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 5. ADMIN AUTHENTICATION HELPER
-- Replace 'marwanbouhamid123@gmail.com' if your admin user email is different.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email') = 'marwanbouhamid123@gmail.com';
$$;

-- 6. RLS POLICIES

-- === Profile ===
DROP POLICY IF EXISTS "Public read profile" ON public.profile;
CREATE POLICY "Public read profile"
  ON public.profile FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin update profile" ON public.profile;
CREATE POLICY "Admin update profile"
  ON public.profile FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === Social Links ===
DROP POLICY IF EXISTS "Public read visible social links" ON public.social_links;
CREATE POLICY "Public read visible social links"
  ON public.social_links FOR SELECT
  USING (visible = true);

DROP POLICY IF EXISTS "Admin full CRUD social links" ON public.social_links;
CREATE POLICY "Admin full CRUD social links"
  ON public.social_links FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === Skills ===
DROP POLICY IF EXISTS "Public read visible skills" ON public.skills;
CREATE POLICY "Public read visible skills"
  ON public.skills FOR SELECT
  USING (visible = true);

DROP POLICY IF EXISTS "Admin full CRUD skills" ON public.skills;
CREATE POLICY "Admin full CRUD skills"
  ON public.skills FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === Projects ===
DROP POLICY IF EXISTS "Public read published projects" ON public.projects;
CREATE POLICY "Public read published projects"
  ON public.projects FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admin full CRUD projects" ON public.projects;
CREATE POLICY "Admin full CRUD projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === Certificates ===
DROP POLICY IF EXISTS "Public read visible certificates" ON public.certificates;
CREATE POLICY "Public read visible certificates"
  ON public.certificates FOR SELECT
  USING (visible = true);

DROP POLICY IF EXISTS "Admin full CRUD certificates" ON public.certificates;
CREATE POLICY "Admin full CRUD certificates"
  ON public.certificates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === Contact Messages ===
-- Anonymous visitors can ONLY submit messages with valid limits
DROP POLICY IF EXISTS "Public insert contact message" ON public.contact_messages;
CREATE POLICY "Public insert contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (
    char_length(name) <= 100 AND
    char_length(email) <= 255 AND
    char_length(subject) <= 200 AND
    char_length(message) <= 3000
  );

-- ONLY Admin can read, mark read, or delete contact messages
DROP POLICY IF EXISTS "Admin view contact messages" ON public.contact_messages;
CREATE POLICY "Admin view contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update contact messages" ON public.contact_messages;
CREATE POLICY "Admin update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete contact messages" ON public.contact_messages;
CREATE POLICY "Admin delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7. STORAGE BUCKET CONFIGURATION & POLICIES
-- Create buckets if storage extension is present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('portfolio-images', 'portfolio-images', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('portfolio-docs', 'portfolio-docs', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Public read
DROP POLICY IF EXISTS "Public read portfolio images" ON storage.objects;
CREATE POLICY "Public read portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

DROP POLICY IF EXISTS "Public read portfolio docs" ON storage.objects;
CREATE POLICY "Public read portfolio docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-docs');

-- Storage RLS: Admin write / delete
DROP POLICY IF EXISTS "Admin upload portfolio images" ON storage.objects;
CREATE POLICY "Admin upload portfolio images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-images' AND
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admin update portfolio images" ON storage.objects;
CREATE POLICY "Admin update portfolio images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-images' AND
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admin delete portfolio images" ON storage.objects;
CREATE POLICY "Admin delete portfolio images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-images' AND
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admin upload portfolio docs" ON storage.objects;
CREATE POLICY "Admin upload portfolio docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-docs' AND
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admin delete portfolio docs" ON storage.objects;
CREATE POLICY "Admin delete portfolio docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-docs' AND
    public.is_admin()
  );
