-- ====================================================================
-- InsightAI Database Migration 002: Data Cleaning & Quality Studio
-- ====================================================================

-- 1. Create dataset_versions table
CREATE TABLE IF NOT EXISTS dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  version_label TEXT NOT NULL DEFAULT 'v1 Original',
  storage_path TEXT NOT NULL,
  row_count BIGINT DEFAULT 0,
  column_count INTEGER DEFAULT 0,
  data_quality_score NUMERIC DEFAULT 0,
  parent_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create dataset_profiles table
CREATE TABLE IF NOT EXISTS dataset_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  row_count BIGINT DEFAULT 0,
  null_count BIGINT DEFAULT 0,
  null_percentage NUMERIC DEFAULT 0,
  unique_count BIGINT DEFAULT 0,
  unique_percentage NUMERIC DEFAULT 0,
  min_val TEXT,
  max_val TEXT,
  mean_val NUMERIC,
  median_val NUMERIC,
  std_dev NUMERIC,
  mode_val TEXT,
  cardinality TEXT DEFAULT 'low',
  outlier_count BIGINT DEFAULT 0,
  distribution JSONB DEFAULT '{}'::jsonb,
  top_values JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create data_quality_scans table
CREATE TABLE IF NOT EXISTS data_quality_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL DEFAULT 100,
  completeness_score NUMERIC NOT NULL DEFAULT 100,
  accuracy_score NUMERIC NOT NULL DEFAULT 100,
  consistency_score NUMERIC NOT NULL DEFAULT 100,
  validity_score NUMERIC NOT NULL DEFAULT 100,
  uniqueness_score NUMERIC NOT NULL DEFAULT 100,
  freshness_score NUMERIC NOT NULL DEFAULT 100,
  issue_counts JSONB DEFAULT '{}'::jsonb,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create data_quality_issues table
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name TEXT,
  issue_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  description TEXT NOT NULL,
  row_count BIGINT DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  sample_values JSONB DEFAULT '[]'::jsonb,
  recommended_action JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'previewed', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 5. Create cleaning_rules table
CREATE TABLE IF NOT EXISTS cleaning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  column_name TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create cleaning_operations table
CREATE TABLE IF NOT EXISTS cleaning_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  column_name TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  rows_affected BIGINT DEFAULT 0,
  before_sample JSONB DEFAULT '[]'::jsonb,
  after_sample JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create cleaning_jobs table
CREATE TABLE IF NOT EXISTS cleaning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 1,
  progress_percentage NUMERIC DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Create validation_rules table
CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'between', 'contains', 'starts_with', 'regex', 'is_null', 'is_not_null')),
  value TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  rule_description TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create validation_results table
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  overall_valid BOOLEAN DEFAULT true,
  passed_rules_count INTEGER DEFAULT 0,
  failed_rules_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create dataset_lineage table
CREATE TABLE IF NOT EXISTS dataset_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  child_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES cleaning_operations(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create outlier_records table
CREATE TABLE IF NOT EXISTS outlier_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  row_index BIGINT NOT NULL,
  val NUMERIC NOT NULL,
  z_score NUMERIC,
  method TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create duplicate_records table
CREATE TABLE IF NOT EXISTS duplicate_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  duplicate_group_id UUID NOT NULL,
  row_index BIGINT NOT NULL,
  similarity_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Create pii_detections table
CREATE TABLE IF NOT EXISTS pii_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  pii_type TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.95,
  sample_masked TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_profiles_dataset_id ON dataset_profiles(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_scans_dataset_id ON data_quality_scans(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_issues_dataset_id ON data_quality_issues(dataset_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_operations_dataset_id ON cleaning_operations(dataset_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_dataset_id ON validation_results(dataset_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlier_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access versions of their own datasets" ON dataset_versions
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_versions.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access profiles of their own datasets" ON dataset_profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_profiles.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access quality scans of their own datasets" ON data_quality_scans
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_quality_scans.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access quality issues of their own datasets" ON data_quality_issues
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_quality_issues.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access cleaning operations of their own datasets" ON cleaning_operations
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = cleaning_operations.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access validation rules of their own datasets" ON validation_rules
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = validation_rules.dataset_id AND datasets.user_id = auth.uid()));

CREATE POLICY "Users can access validation results of their own datasets" ON validation_results
  FOR ALL USING (EXISTS (SELECT 1 FROM datasets WHERE datasets.id = validation_results.dataset_id AND datasets.user_id = auth.uid()));
