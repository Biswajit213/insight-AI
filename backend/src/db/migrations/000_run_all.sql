-- ====================================================================
-- InsightAI: Run ALL Migrations in Order
-- Paste this entire file into Supabase → SQL Editor and click Run
-- Safe to run multiple times (all statements use IF NOT EXISTS)
-- ====================================================================


-- ====================================================================
-- MIGRATION 001: Core Schema
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- updated_at auto-trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL,
  full_name   TEXT,
  email       TEXT NOT NULL,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- datasets
CREATE TABLE IF NOT EXISTS datasets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  name                TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  file_type           TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'xls')),
  file_size           BIGINT NOT NULL,
  row_count           BIGINT DEFAULT 0,
  column_count        INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  data_quality_score  NUMERIC DEFAULT 0,
  storage_path        TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- dataset_columns
CREATE TABLE IF NOT EXISTS dataset_columns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id   UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  column_name  TEXT NOT NULL,
  data_type    TEXT NOT NULL,
  nullable     BOOLEAN DEFAULT true,
  unique_values   BIGINT DEFAULT 0,
  missing_values  BIGINT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- analyses
CREATE TABLE IF NOT EXISTS analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  dataset_id     UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  analysis_type  TEXT NOT NULL,
  title          TEXT NOT NULL,
  query          JSONB DEFAULT '{}'::jsonb,
  result         JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ai_conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  dataset_id  UUID REFERENCES datasets(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ai_messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  metadata         JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- insights
CREATE TABLE IF NOT EXISTS insights (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  dataset_id   UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('trend','opportunity','risk','anomaly','forecast','recommendation')),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  confidence   NUMERIC DEFAULT 0.90,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- anomalies
CREATE TABLE IF NOT EXISTS anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  dataset_id      UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  metric          TEXT NOT NULL,
  description     TEXT NOT NULL,
  expected_value  NUMERIC NOT NULL,
  actual_value    NUMERIC NOT NULL,
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved')),
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  dataset_id  UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'generating' CHECK (status IN ('generating','completed','failed')),
  content     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID,
  action         TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    UUID,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ai_usage
CREATE TABLE IF NOT EXISTS ai_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  model           TEXT NOT NULL,
  request_type    TEXT NOT NULL,
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  total_tokens    INTEGER DEFAULT 0,
  estimated_cost  NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_datasets_user_id          ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at       ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id          ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id  ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id          ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user_id         ON anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id           ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id        ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id          ON ai_usage(user_id);

-- RLS
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage        ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first so re-runs don't error)
DROP POLICY IF EXISTS "profiles_select"   ON profiles;
DROP POLICY IF EXISTS "profiles_update"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert"   ON profiles;
DROP POLICY IF EXISTS "datasets_all"      ON datasets;
DROP POLICY IF EXISTS "dataset_cols_all"  ON dataset_columns;
DROP POLICY IF EXISTS "analyses_all"      ON analyses;
DROP POLICY IF EXISTS "conversations_all" ON ai_conversations;
DROP POLICY IF EXISTS "messages_all"      ON ai_messages;
DROP POLICY IF EXISTS "insights_all"      ON insights;
DROP POLICY IF EXISTS "anomalies_all"     ON anomalies;
DROP POLICY IF EXISTS "reports_all"       ON reports;
DROP POLICY IF EXISTS "audit_select"      ON audit_logs;
DROP POLICY IF EXISTS "ai_usage_select"   ON ai_usage;

CREATE POLICY "profiles_select"   ON profiles        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update"   ON profiles        FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert"   ON profiles        FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "datasets_all"      ON datasets        FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "dataset_cols_all"  ON dataset_columns FOR ALL    USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_columns.dataset_id AND datasets.user_id = auth.uid()));
CREATE POLICY "analyses_all"      ON analyses        FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "conversations_all" ON ai_conversations FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "messages_all"      ON ai_messages     FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "insights_all"      ON insights        FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "anomalies_all"     ON anomalies       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "reports_all"       ON reports         FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "audit_select"      ON audit_logs      FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_usage_select"   ON ai_usage        FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on Google OAuth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;


-- ====================================================================
-- MIGRATION 002: Data Cleaning Schema
-- ====================================================================

CREATE TABLE IF NOT EXISTS dataset_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id        UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  version_number    INTEGER NOT NULL DEFAULT 1,
  version_label     TEXT NOT NULL DEFAULT 'v1 Original',
  storage_path      TEXT NOT NULL,
  row_count         BIGINT DEFAULT 0,
  column_count      INTEGER DEFAULT 0,
  data_quality_score NUMERIC DEFAULT 0,
  parent_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name         TEXT NOT NULL,
  data_type           TEXT NOT NULL,
  row_count           BIGINT DEFAULT 0,
  null_count          BIGINT DEFAULT 0,
  null_percentage     NUMERIC DEFAULT 0,
  unique_count        BIGINT DEFAULT 0,
  unique_percentage   NUMERIC DEFAULT 0,
  min_val TEXT, max_val TEXT, mean_val NUMERIC, median_val NUMERIC,
  std_dev NUMERIC, mode_val TEXT,
  cardinality         TEXT DEFAULT 'low',
  outlier_count       BIGINT DEFAULT 0,
  distribution        JSONB DEFAULT '{}'::jsonb,
  top_values          JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_scans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id           UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id   UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  overall_score        NUMERIC NOT NULL DEFAULT 100,
  completeness_score   NUMERIC NOT NULL DEFAULT 100,
  accuracy_score       NUMERIC NOT NULL DEFAULT 100,
  consistency_score    NUMERIC NOT NULL DEFAULT 100,
  validity_score       NUMERIC NOT NULL DEFAULT 100,
  uniqueness_score     NUMERIC NOT NULL DEFAULT 100,
  freshness_score      NUMERIC NOT NULL DEFAULT 100,
  issue_counts         JSONB DEFAULT '{}'::jsonb,
  scanned_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name         TEXT,
  issue_type          TEXT NOT NULL,
  severity            TEXT DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low','info')),
  description         TEXT NOT NULL,
  row_count           BIGINT DEFAULT 0,
  percentage          NUMERIC DEFAULT 0,
  sample_values       JSONB DEFAULT '[]'::jsonb,
  recommended_action  JSONB DEFAULT '{}'::jsonb,
  status              TEXT DEFAULT 'open' CHECK (status IN ('open','previewed','resolved','ignored')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cleaning_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  dataset_id  UUID REFERENCES datasets(id) ON DELETE CASCADE,
  rule_code   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  column_name TEXT,
  parameters  JSONB DEFAULT '{}'::jsonb,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cleaning_operations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  operation_type      TEXT NOT NULL,
  column_name         TEXT,
  parameters          JSONB DEFAULT '{}'::jsonb,
  rows_affected       BIGINT DEFAULT 0,
  before_sample       JSONB DEFAULT '[]'::jsonb,
  after_sample        JSONB DEFAULT '[]'::jsonb,
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cleaning_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  current_step        INTEGER DEFAULT 0,
  total_steps         INTEGER DEFAULT 1,
  progress_percentage NUMERIC DEFAULT 0,
  error_message       TEXT,
  started_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS validation_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id       UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  column_name      TEXT NOT NULL,
  operator         TEXT NOT NULL CHECK (operator IN ('equals','not_equals','greater_than','less_than','between','contains','starts_with','regex','is_null','is_not_null')),
  value            TEXT,
  min_value        NUMERIC,
  max_value        NUMERIC,
  rule_description TEXT NOT NULL,
  is_enabled       BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  overall_valid       BOOLEAN DEFAULT true,
  passed_rules_count  INTEGER DEFAULT 0,
  failed_rules_count  INTEGER DEFAULT 0,
  details             JSONB DEFAULT '[]'::jsonb,
  validated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_lineage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  child_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  operation_id      UUID REFERENCES cleaning_operations(id) ON DELETE SET NULL,
  description       TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlier_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name         TEXT NOT NULL,
  row_index           BIGINT NOT NULL,
  val                 NUMERIC NOT NULL,
  z_score             NUMERIC,
  method              TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS duplicate_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  duplicate_group_id  UUID NOT NULL,
  row_index           BIGINT NOT NULL,
  similarity_score    NUMERIC DEFAULT 1.0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pii_detections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id  UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name         TEXT NOT NULL,
  pii_type            TEXT NOT NULL,
  confidence          NUMERIC DEFAULT 0.95,
  sample_masked       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id   ON dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_profiles_dataset_id   ON dataset_profiles(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_scans_dataset_id ON data_quality_scans(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_dataset_id ON data_quality_issues(dataset_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_operations_dataset_id ON cleaning_operations(dataset_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_dataset_id  ON validation_results(dataset_id);

ALTER TABLE dataset_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_scans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_lineage     ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlier_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detections      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dataset_versions_all"    ON dataset_versions;
DROP POLICY IF EXISTS "dataset_profiles_all"    ON dataset_profiles;
DROP POLICY IF EXISTS "quality_scans_all"       ON data_quality_scans;
DROP POLICY IF EXISTS "quality_issues_all"      ON data_quality_issues;
DROP POLICY IF EXISTS "cleaning_ops_all"        ON cleaning_operations;
DROP POLICY IF EXISTS "validation_rules_all"    ON validation_rules;
DROP POLICY IF EXISTS "validation_results_all"  ON validation_results;

CREATE POLICY "dataset_versions_all"    ON dataset_versions    FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_versions.dataset_id   AND datasets.user_id = auth.uid()));
CREATE POLICY "dataset_profiles_all"    ON dataset_profiles    FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_profiles.dataset_id   AND datasets.user_id = auth.uid()));
CREATE POLICY "quality_scans_all"       ON data_quality_scans  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_quality_scans.dataset_id  AND datasets.user_id = auth.uid()));
CREATE POLICY "quality_issues_all"      ON data_quality_issues FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_quality_issues.dataset_id AND datasets.user_id = auth.uid()));
CREATE POLICY "cleaning_ops_all"        ON cleaning_operations FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = cleaning_operations.dataset_id AND datasets.user_id = auth.uid()));
CREATE POLICY "validation_rules_all"    ON validation_rules    FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = validation_rules.dataset_id    AND datasets.user_id = auth.uid()));
CREATE POLICY "validation_results_all"  ON validation_results  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = validation_results.dataset_id  AND datasets.user_id = auth.uid()));


-- ====================================================================
-- MIGRATION 003: Upload Activity History
-- ====================================================================

CREATE TABLE IF NOT EXISTS upload_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  -- No FK to datasets — history should survive even if dataset is deleted
  dataset_id     UUID,
  file_name      TEXT NOT NULL,
  dataset_name   TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes     BIGINT NOT NULL DEFAULT 0,
  row_count      BIGINT NOT NULL DEFAULT 0,
  column_count   INTEGER NOT NULL DEFAULT 0,
  missing_values INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'connected'
                   CHECK (status IN ('connected','processing','needs_attention','failed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_history_user_id     ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_uploaded_at ON upload_history(uploaded_at DESC);

ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upload_history_all" ON upload_history;

-- Policy allows both Supabase Auth users (Google) and service-role inserts (email login)
-- The backend uses service_role key which bypasses RLS, so this policy covers
-- direct client queries only. We keep it permissive for authenticated users.
CREATE POLICY "upload_history_all"
  ON upload_history FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
