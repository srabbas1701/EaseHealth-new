# SQL Directory Structure

This directory contains all SQL files for the EaseHealth project, organized by purpose:

## Directory Structure

### 📁 migrations/
Schema changes and database structure updates:
- Table creation
- Column additions
- Function definitions

### 📁 setup/
Initial setup and storage configuration:
- Storage buckets setup
- Storage policies
- Document storage configuration

### 📁 fixes/
Bug fixes and corrections:
- Constraint fixes
- RLS policy corrections
- Data cleanup scripts

### 📁 verification/
Testing and verification scripts:
- Table structure checks
- System verification
- Appointment checks

### 📁 data/
Test data and initial data population:
- Specialties data
- Test doctor records
- Sample data insertion

## Usage

1. **New Migrations**:
   - Add new migration files to `migrations/`
   - Use timestamp prefix for ordering (YYYYMMDD_description.sql)

2. **Running Fixes**:
   - Check `fixes/` directory for existing solutions
   - Add new fixes with clear descriptions

3. **Verification**:
   - Run verification scripts before/after changes
   - Add new checks to `verification/`

4. **Test Data**:
   - Use scripts in `data/` for populating test environments
   - Keep production data scripts separate from test data
