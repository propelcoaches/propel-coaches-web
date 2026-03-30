-- AI Coach Reviews — Phase 4
-- Adds ai_adjustments_paused to profiles for coach override control

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_adjustments_paused boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_ai_paused ON profiles(ai_adjustments_paused) WHERE ai_adjustments_paused = true;

-- View: ai_review_summary for the web dashboard
-- Joins ai_agent_logs (check_in trigger) with profiles to show client name + review details
CREATE OR REPLACE VIEW ai_review_summary AS
SELECT
  l.id,
  l.user_id,
  p.name         AS client_name,
  p.email        AS client_email,
  p.ai_adjustments_paused,
  l.input_summary,
  l.output_action,
  l.tokens_used,
  l.latency_ms,
  l.error,
  l.created_at
FROM ai_agent_logs l
JOIN profiles p ON p.id = l.user_id
WHERE l.trigger_type = 'check_in';
