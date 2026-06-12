-- ==============================================================
-- Migration 005: Remove responsible_agency column
-- ==============================================================

-- First, clear existing data in the column (set to NULL)
UPDATE cases SET responsible_agency = NULL WHERE responsible_agency IS NOT NULL;

-- Then drop the column from the table
ALTER TABLE cases DROP COLUMN IF EXISTS responsible_agency;
