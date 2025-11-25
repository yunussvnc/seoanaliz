/*
  # CMS İçerik Tabloları (V2)

  Eski CMS şemasını kaldırıp final tasarımla yeniden oluşturur.
  Bu işlem mevcut veriyi sıfırlar; admin panel geliştirme aşamasında olduğu için
  veri kaybı beklenmiyor.
*/

-- Drop legacy tables to avoid schema drift
DROP TABLE IF EXISTS public.page_revisions CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.admin_activity_logs CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- Pages
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  hero_image_url text,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  editor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pages_status_check CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived'))
);

-- Page revisions
CREATE TABLE public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  version int NOT NULL,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_revisions_unique_version UNIQUE (page_id, version)
);

-- Posts / blog entries
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  cover_image_url text,
  tags text[] DEFAULT '{}',
  published_at timestamptz,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  editor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT posts_status_check CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived'))
);

-- Media assets (metadata for files stored in Supabase Storage)
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'public',
  path text NOT NULL UNIQUE,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin activity logs
CREATE TABLE public.admin_activity_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Site settings (key/value)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default site settings
INSERT INTO public.site_settings (key, value, is_public)
VALUES
  ('site_status', jsonb_build_object('isOnline', true, 'message', 'Site is live'), false),
  ('hero', jsonb_build_object('title', 'Hoş geldiniz', 'subtitle', 'SEO çözümleri için bize güvenin'), true)
ON CONFLICT (key) DO NOTHING;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pages_status_published_at ON public.pages (status, published_at);
CREATE INDEX IF NOT EXISTS idx_pages_author_id ON public.pages (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON public.posts (status, published_at);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket_path ON public.media_assets (bucket, path);
CREATE INDEX IF NOT EXISTS idx_admin_logs_actor ON public.admin_activity_logs (actor_id, created_at);

-- Re-use updated_at trigger for new tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Publish policies (anyone can read published pages/posts)
CREATE POLICY "Public can read published pages"
  ON public.pages
  FOR SELECT
  TO public
  USING (
    status = 'published'
    AND (published_at IS NULL OR published_at <= now())
  );

CREATE POLICY "Admins manage pages"
  ON public.pages
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Public can read published posts"
  ON public.posts
  FOR SELECT
  TO public
  USING (
    status = 'published'
    AND (published_at IS NULL OR published_at <= now())
  );

CREATE POLICY "Admins manage posts"
  ON public.posts
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admins manage page revisions"
  ON public.page_revisions
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admins manage media assets"
  ON public.media_assets
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admins read activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admins insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

CREATE POLICY "Public can read public site settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (is_public);

CREATE POLICY "Admins manage site settings"
  ON public.site_settings
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- Reuse updated_at trigger on pages/posts/site_settings
DROP TRIGGER IF EXISTS trg_pages_updated_at ON public.pages;
CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

