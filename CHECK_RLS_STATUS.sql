-- Check if RLS is enabled on patient_reports table
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'patient_reports';













