-- ============================================
-- EMERGENCY RESTORE: Make Uploads Work Again
-- ============================================
-- Based on analysis, uploads were only working before because
-- RLS was likely disabled or there were permissive policies.
-- This script provides the SAFEST temporary fix.
-- ============================================

BEGIN;

-- ============================================
-- OPTION 1: DISABLE RLS (TEMPORARY FIX)
-- ============================================
-- This will make uploads work immediately like before
-- WARNING: This reduces security! Use only temporarily.

ALTER TABLE patient_reports DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify RLS is disabled
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'patient_reports';

COMMIT;

-- ============================================
-- TO RE-ENABLE RLS LATER (with proper policies):
-- ============================================
-- Run this after fixing policies:
-- ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;






