-- Add source column to tasks for tracking auto-created tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('manual', 'check_in', 'message')) DEFAULT 'manual';
