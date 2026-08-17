-- ====================================================================
-- InsightAI Database Migration 003: Upload Activity History
-- ====================================================================

-- Stores per-user upload activity history so it survives re-login
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  row_count BIGINT NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  missing_values INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'processing', 'needs_attention', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_uploaded_at ON upload_history(uploaded_at DESC);

ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own upload history"
  ON upload_history FOR ALL
  USING (auth.uid() = user_id);
