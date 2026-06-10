-- ==============================================================
-- Compensation Monitoring System — Telangana Women Safety Wing
-- Full Schema Migration
-- ==============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS case_step_history CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS case_type CASCADE;
DROP TYPE IF EXISTS comp_type CASCADE;
DROP TYPE IF EXISTS case_status CASCADE;
DROP TYPE IF EXISTS data_source CASCADE;

-- ENUM types
CREATE TYPE case_type AS ENUM ('RAPE', 'POCSO', 'ITPA', 'OTHER_CAW', 'CHILD_VICTIM');
CREATE TYPE comp_type AS ENUM ('INTERIM', 'FINAL', 'SPECIAL', 'INTERIM_AND_FINAL');
CREATE TYPE case_status AS ENUM ('ACTIVE', 'STALLED', 'PAID', 'CLOSED', 'UNDER_REVIEW');
CREATE TYPE data_source AS ENUM ('BHAROSA', 'AHTU_PMU', 'ACP_LAW_ORDER', 'DLSA', 'OTHER');

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_number VARCHAR(100) UNIQUE NOT NULL,
  cc_number VARCHAR(100),
  case_type case_type NOT NULL,
  district_id INT REFERENCES districts(id),
  data_source data_source NOT NULL,
  date_of_fir DATE NOT NULL,
  victim_age INT,
  victim_gender VARCHAR(20) DEFAULT 'Female',
  is_minor BOOLEAN GENERATED ALWAYS AS (victim_age IS NOT NULL AND victim_age < 18) STORED,
  eligible_for_compensation BOOLEAN DEFAULT TRUE,
  comp_type comp_type,
  comp_amount_approved NUMERIC(12,2),
  comp_amount_disbursed NUMERIC(12,2),
  current_step INT DEFAULT 1 CHECK (current_step BETWEEN 1 AND 9),
  status case_status DEFAULT 'ACTIVE',
  responsible_officer VARCHAR(200),
  responsible_agency VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow steps (9 steps per the defined process)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  step_number INT NOT NULL CHECK (step_number BETWEEN 1 AND 9),
  step_name VARCHAR(200) NOT NULL,
  responsible_actor VARCHAR(200) NOT NULL,
  description TEXT,
  expected_days_from_fir INT,
  required_documents TEXT[],
  document_sources TEXT[]
);

-- Per-case step tracking
CREATE TABLE IF NOT EXISTS case_step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  step_number INT NOT NULL CHECK (step_number BETWEEN 1 AND 9),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(200),
  notes TEXT,
  documents_received TEXT[],
  delay_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts for stalled or overdue cases
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for all changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(200),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================
-- SEED DATA
-- ==============================================================

-- Insert Telangana districts
INSERT INTO districts (name) VALUES
  ('Hyderabad'),('Rangareddy'),('Medchal-Malkajgiri'),('Sangareddy'),
  ('Vikarabad'),('Mahabubnagar'),('Nagarkurnool'),('Wanaparthy'),
  ('Gadwal'),('Narayanpet'),('Nalgonda'),('Suryapet'),
  ('Yadadri Bhuvanagiri'),('Khammam'),('Bhadradri Kothagudem'),
  ('Warangal'),('Hanamkonda'),('Jangaon'),('Mahabubabad'),
  ('Mulugu'),('Karimnagar'),('Peddapalli'),('Jagtial'),
  ('Rajanna Sircilla'),('Nizamabad'),('Kamareddy'),('Nirmal'),
  ('Adilabad'),('Mancherial'),('Kumuram Bheem')
ON CONFLICT DO NOTHING;

-- Insert the 9 standard workflow steps
INSERT INTO workflow_steps (step_number, step_name, responsible_actor, description, expected_days_from_fir, required_documents, document_sources) VALUES
  (1, 'FIR Registered', 'Police Station', 'First Information Report filed at the police station', 0, ARRAY['FIR copy'], ARRAY['Police station']),
  (2, 'IO Documents Collected', 'Investigating Officer', 'IO collects all documents required for compensation file', 3, ARRAY['FIR copy','Medical certificate','Age proof','Victim statement'], ARRAY['Police file','Hospital','Bharosa Centre']),
  (3, 'DLSA Notified', 'DLSA Para Legal Volunteer', 'District Legal Services Authority informed of case within 7 days', 7, ARRAY['FIR copy','Intimation letter'], ARRAY['Police station','DLSA office']),
  (4, 'Social Investigation', 'DLSA + Bharosa Centre', 'Social Investigation Report (SIR) prepared by social worker', 15, ARRAY['Social investigation report','Family background report','Victim consent'], ARRAY['Bharosa Centre','DLSA']),
  (5, 'Interim Compensation Applied', 'DLSA', 'DLSA submits interim compensation application to District Collector', 21, ARRAY['FIR copy','Medical certificate','Age proof','SIR','Bank account details'], ARRAY['Police file','Hospital','Bharosa','DLSA']),
  (6, 'Collector Approved', 'District Collector Office', 'District Collector reviews and approves interim compensation', 30, ARRAY['DLSA application','All supporting documents','Treasury challan'], ARRAY['DLSA submission','Treasury office']),
  (7, 'Court Order', 'Sessions Court', 'Court issues compensation order at trial or conviction stage', NULL, ARRAY['Court order copy','Judgment extract'], ARRAY['Court registry']),
  (8, 'Fund Released', 'SLSA / Treasury', 'State Legal Services Authority or Treasury releases funds', 45, ARRAY['Collector approval order','Court order','Victim bank details'], ARRAY['SLSA','Treasury','District Collector']),
  (9, 'Paid to Victim', 'Bank', 'Compensation amount transferred to victim bank account', 60, ARRAY['Bank transfer receipt','Acknowledgment from victim'], ARRAY['Bank','DLSA records'])
ON CONFLICT DO NOTHING;

-- ==============================================================
-- INSERT DEMO CASES (using Victim A, B, C etc. — no real names)
-- ==============================================================

-- Get district IDs
WITH district_ids AS (
  SELECT id, name FROM districts
),
demo_cases AS (
  INSERT INTO cases (fir_number, cc_number, case_type, district_id, data_source, date_of_fir, victim_age, eligible_for_compensation, comp_type, comp_amount_approved, comp_amount_disbursed, current_step, status, responsible_officer, responsible_agency, notes)
  VALUES
    ('FIR-2024-001', 'CC-2024-001', 'POCSO', (SELECT id FROM district_ids WHERE name='Hyderabad'), 'BHAROSA', '2024-01-15', 14, TRUE, 'INTERIM_AND_FINAL', 500000, 200000, 9, 'PAID', 'Smt. Priya Sharma', 'DLSA Hyderabad', 'Victim A - Case fully resolved, compensation paid'),
    ('FIR-2024-002', 'CC-2024-002', 'RAPE', (SELECT id FROM district_ids WHERE name='Warangal'), 'BHAROSA', '2024-03-10', 22, TRUE, 'INTERIM', 300000, 100000, 8, 'ACTIVE', 'Shri. Ramesh Kumar', 'SLSA Warangal', 'Victim B - Interim paid, awaiting final'),
    ('FIR-2024-003', NULL, 'ITPA', (SELECT id FROM district_ids WHERE name='Rangareddy'), 'AHTU_PMU', '2024-04-20', 17, TRUE, 'INTERIM', 200000, NULL, 3, 'STALLED', 'Smt. Sunita Devi', 'AHTU PMU', 'Victim C - Stalled at DLSA notification'),
    ('FIR-2024-004', 'CC-2024-003', 'RAPE', (SELECT id FROM district_ids WHERE name='Karimnagar'), 'ACP_LAW_ORDER', '2024-06-05', 25, TRUE, 'FINAL', 400000, 400000, 9, 'PAID', 'Shri. Vikram Singh', 'ACP Law & Order', 'Victim D - Fully paid'),
    ('FIR-2024-005', NULL, 'POCSO', (SELECT id FROM district_ids WHERE name='Nizamabad'), 'BHAROSA', '2024-08-12', 13, TRUE, 'INTERIM_AND_FINAL', 600000, NULL, 5, 'UNDER_REVIEW', 'Smt. Anjali Reddy', 'DLSA Nizamabad', 'Victim E - Under review at collector level'),
    ('FIR-2024-006', 'CC-2024-004', 'OTHER_CAW', (SELECT id FROM district_ids WHERE name='Khammam'), 'AHTU_PMU', '2024-09-01', 30, TRUE, 'SPECIAL', 250000, NULL, 2, 'ACTIVE', 'Shri. Mohan Rao', 'AHTU PMU Khammam', 'Victim F - IO collecting documents')
  RETURNING id, fir_number, current_step
)
SELECT * FROM demo_cases;

-- ==============================================================
-- INSERT STEP HISTORY FOR DEMO CASES
-- ==============================================================

-- For each demo case, mark completed steps
-- Case 1 (FIR-2024-001) - All 9 steps complete
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, step_number, TRUE, NOW() - (random() * interval '300 days'), 'System', 'Step completed'
FROM cases CROSS JOIN generate_series(1, 9) AS step_number
WHERE fir_number = 'FIR-2024-001';

-- Case 2 (FIR-2024-002) - Steps 1-7 complete, step 8 in progress
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, step_number, TRUE, NOW() - (random() * interval '200 days'), 'System', 'Step completed'
FROM cases CROSS JOIN generate_series(1, 7) AS step_number
WHERE fir_number = 'FIR-2024-002';

-- Case 3 (FIR-2024-003) - Steps 1-2 complete, stalled at step 3
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, step_number, TRUE, NOW() - (random() * interval '150 days'), 'System', 'Step completed'
FROM cases CROSS JOIN generate_series(1, 2) AS step_number
WHERE fir_number = 'FIR-2024-003';

-- Case 4 (FIR-2024-004) - All 9 steps complete
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, step_number, TRUE, NOW() - (random() * interval '180 days'), 'System', 'Step completed'
FROM cases CROSS JOIN generate_series(1, 9) AS step_number
WHERE fir_number = 'FIR-2024-004';

-- Case 5 (FIR-2024-005) - Steps 1-4 complete
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, step_number, TRUE, NOW() - (random() * interval '100 days'), 'System', 'Step completed'
FROM cases CROSS JOIN generate_series(1, 4) AS step_number
WHERE fir_number = 'FIR-2024-005';

-- Case 6 (FIR-2024-006) - Step 1 complete
INSERT INTO case_step_history (case_id, step_number, completed, completed_at, completed_by, notes)
SELECT id, 1, TRUE, NOW() - interval '30 days', 'System', 'FIR Registered'
FROM cases
WHERE fir_number = 'FIR-2024-006';

-- ==============================================================
-- INSERT ALERTS
-- ==============================================================
INSERT INTO alerts (case_id, alert_type, message, is_resolved) VALUES
  ((SELECT id FROM cases WHERE fir_number = 'FIR-2024-003'), 'STALLED', 'Case FIR-2024-003 has been at step 3 (DLSA Notified) for over 120 days', FALSE),
  ((SELECT id FROM cases WHERE fir_number = 'FIR-2024-005'), 'PENDING_APPROVAL', 'Interim compensation application pending at Collector for FIR-2024-005', FALSE),
  ((SELECT id FROM cases WHERE fir_number = 'FIR-2024-006'), 'MISSING_DOCS', 'Medical certificate and age proof not yet collected for FIR-2024-006', FALSE);

-- ==============================================================
-- INDEXES
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_cases_fir ON cases(fir_number);
CREATE INDEX IF NOT EXISTS idx_cases_cc ON cases(cc_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_district ON cases(district_id);
CREATE INDEX IF NOT EXISTS idx_step_history_case ON case_step_history(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_case ON alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_log(case_id);

-- ==============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ==============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at ON cases;
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
