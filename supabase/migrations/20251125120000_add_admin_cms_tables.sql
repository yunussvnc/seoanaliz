/*
  # Admin CMS tabloları

  - pages & page_revisions
  - posts (blog)
  - media_assets (storage metadata)
  - site_settings (feature bayrakları)
  - admin_activity_logs (audit)

  RLS:
    * Public yalnızca yayınlanmış sayfa/post görebilir.
    * CRUD sadece role=admin JWT taşıyan kullanıcılarda açık.
*/

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  hero_image text,
  seo_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  author text DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_page_status CHECK (status IN ('draft','scheduled','published','archived'))
);

CREATE TABLE IF NOT EXISTS page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  cover_image text,
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_post_status CHECK (status IN ('draft','scheduled','published','archived'))
);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text,
  file_size bigint,
  alt_text text,
  category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger reuse
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper expression
-- (auth.jwt() returns json, safe compare when token yoksa false)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT coalesce(auth.jwt()->>'role', '') = 'admin';
$$;

-- PAGES RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published pages"
  ON pages FOR SELECT
  USING (
    status = 'published'
    AND coalesce(published_at, now()) <= now()
  );

CREATE POLICY "Admins full access pages"
  ON pages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- PAGE REVISIONS
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage revisions"
  ON page_revisions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts"
  ON posts FOR SELECT
  USING (
    status = 'published'
    AND coalesce(published_at, now()) <= now()
  );

CREATE POLICY "Admins full access posts"
  ON posts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at);

-- MEDIA ASSETS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active media"
  ON media_assets FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins full access media"
  ON media_assets FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- SITE SETTINGS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage settings"
  ON site_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ACTIVITY LOGS
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON admin_activity_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "System inserts logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (true);

-- Varsayılan ayarlar
INSERT INTO site_settings (key, payload)
VALUES ('global', jsonb_build_object('site_online', true))
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_pages_status_slug ON pages(status, slug);
CREATE INDEX IF NOT EXISTS idx_pages_published_at ON pages(published_at);

-- Storage bucket + RLS
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Public read media bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Admins manage media bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'media' AND is_admin())
WITH CHECK (bucket_id = 'media' AND is_admin());

