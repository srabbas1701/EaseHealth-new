/*
  # Add review/lock metadata to patient_reports

  - Adds reviewed_by, reviewed_at for clinical review audit
  - Adds linked_consultation_id to reference existing consultations
  - Adds helpful indexes for dashboard filtering
*/

ALTER TABLE public.patient_reports
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patient_reports_reviewed_at
  ON public.patient_reports(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_patient_reports_locked_deleted
  ON public.patient_reports(patient_id, is_deleted, locked, upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_patient_reports_linked_consultation
  ON public.patient_reports(linked_consultation_id);

COMMENT ON COLUMN public.patient_reports.reviewed_by IS 'auth.users.id of reviewer (doctor user)';
COMMENT ON COLUMN public.patient_reports.reviewed_at IS 'Timestamp when doctor reviewed the report';
COMMENT ON COLUMN public.patient_reports.linked_consultation_id IS 'Consultation that used this report';


