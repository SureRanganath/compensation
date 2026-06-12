-- ==============================================================
-- Supervisor Notes for Case Step History
-- Allows supervisors to add observation notes on pending steps
-- without completing them. Admin can view and delete these notes.
-- ==============================================================

ALTER TABLE case_step_history
  ADD COLUMN IF NOT EXISTS supervisor_notes TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_notes_by VARCHAR(200);
