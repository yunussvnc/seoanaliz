/*
-- Reporting disabled: keep this SQL for reference if you re-enable reports.
-- Optional: store reports in Supabase Postgres
CREATE TABLE IF NOT EXISTS seo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
*/
