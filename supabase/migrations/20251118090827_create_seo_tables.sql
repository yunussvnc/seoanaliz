/*
  # SEO Araçları Veritabanı Şeması

  ## Yeni Tablolar
  
  ### `users` - Kullanıcı Bilgileri
    - `id` (uuid, primary key) - Kullanıcı ID
    - `email` (text, unique) - E-posta adresi
    - `name` (text) - Kullanıcı adı
    - `created_at` (timestamptz) - Oluşturma tarihi
    - `updated_at` (timestamptz) - Güncelleme tarihi

  ### `projects` - SEO Projeleri
    - `id` (uuid, primary key) - Proje ID
    - `user_id` (uuid, foreign key) - Kullanıcı ID
    - `domain` (text) - Alan adı
    - `name` (text) - Proje adı
    - `status` (text) - Durum (active, paused, archived)
    - `created_at` (timestamptz) - Oluşturma tarihi
    - `updated_at` (timestamptz) - Güncelleme tarihi

  ### `seo_analyses` - SEO Analizleri
    - `id` (uuid, primary key) - Analiz ID
    - `project_id` (uuid, foreign key) - Proje ID
    - `analysis_type` (text) - Analiz tipi (keyword, page_speed, competitors)
    - `results` (jsonb) - Analiz sonuçları
    - `score` (integer) - Skor (0-100)
    - `created_at` (timestamptz) - Analiz tarihi

  ### `keywords` - Anahtar Kelimeler
    - `id` (uuid, primary key) - Anahtar kelime ID
    - `project_id` (uuid, foreign key) - Proje ID
    - `keyword` (text) - Anahtar kelime
    - `position` (integer) - Google sıralaması
    - `search_volume` (integer) - Arama hacmi
    - `difficulty` (integer) - Zorluk (0-100)
    - `checked_at` (timestamptz) - Kontrol tarihi
    - `created_at` (timestamptz) - Oluşturma tarihi

  ## Güvenlik
    - Tüm tablolarda RLS (Row Level Security) etkinleştirildi
    - Kullanıcılar sadece kendi verilerine erişebilir
    - Authenticated kullanıcılar için politikalar tanımlandı

  ## Notlar
    - Tüm ID'ler UUID formatında
    - Timestamp'ler timezone bilgisi ile saklanıyor
    - JSONB formatı esnek veri saklama için kullanılıyor
*/

-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects tablosu
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'archived'))
);

-- SEO Analyses tablosu
CREATE TABLE IF NOT EXISTS seo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  analysis_type text NOT NULL,
  results jsonb DEFAULT '{}' NOT NULL,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_analysis_type CHECK (analysis_type IN ('keyword', 'page_speed', 'competitors', 'content', 'technical'))
);

-- Keywords tablosu
CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  keyword text NOT NULL,
  position integer DEFAULT 0,
  search_volume integer DEFAULT 0,
  difficulty integer DEFAULT 0,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_position CHECK (position >= 0),
  CONSTRAINT valid_difficulty CHECK (difficulty >= 0 AND difficulty <= 100)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON projects(domain);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_project_id ON seo_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_type ON seo_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_keywords_project_id ON keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);

-- RLS Politikaları

-- Users tablosu RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects tablosu RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SEO Analyses tablosu RLS
ALTER TABLE seo_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON seo_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = seo_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own analyses"
  ON seo_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = seo_analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Keywords tablosu RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords"
  ON keywords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own keywords"
  ON keywords FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own keywords"
  ON keywords FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = keywords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
