-- Drop parked legacy_* tables after v2 cutover smoke passes (#61).
-- HUMAN GATE: do not run on production without backup + approval.
-- Safe only when:
--   1) App reads/writes v2 tables only (Case, TreatmentNote, …)
--   2) Staging smoke checklist docs/staging-smoke-v2.md is complete
--   3) Backup taken the same day
--
-- Usage (MySQL):
--   mysql ... < scripts/sql/drop-legacy-tables.sql
-- Or run statements one-by-one after verifying each table exists.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `legacy_questions_problem`;
DROP TABLE IF EXISTS `legacy_questions_phqa_addon`;
DROP TABLE IF EXISTS `legacy_questions_phqa`;
DROP TABLE IF EXISTS `legacy_questions_9q`;
DROP TABLE IF EXISTS `legacy_questions_8q`;
DROP TABLE IF EXISTS `legacy_questions_2q`;
DROP TABLE IF EXISTS `legacy_questions_master`;
DROP TABLE IF EXISTS `legacy_referent`;
DROP TABLE IF EXISTS `legacy_emergencycontact`;
DROP TABLE IF EXISTS `legacy_address`;
DROP TABLE IF EXISTS `legacy_school_screening`;
DROP TABLE IF EXISTS `legacy_school`;
DROP TABLE IF EXISTS `legacy_profile_admin`;
DROP TABLE IF EXISTS `legacy_profile`;
DROP TABLE IF EXISTS `legacy_employee_type`;
DROP TABLE IF EXISTS `legacy_volunteer_type`;
DROP TABLE IF EXISTS `legacy_affiliation`;
DROP TABLE IF EXISTS `legacy_roles`;
DROP TABLE IF EXISTS `legacy_account`;
DROP TABLE IF EXISTS `legacy_session`;
DROP TABLE IF EXISTS `legacy_verificationtoken`;
DROP TABLE IF EXISTS `legacy_user`;
DROP TABLE IF EXISTS `legacy_subdistricts`;
DROP TABLE IF EXISTS `legacy_districts`;
DROP TABLE IF EXISTS `legacy_provinces`;

SET FOREIGN_KEY_CHECKS = 1;

-- Rollback: restore from backup taken before this script. Do not expect
-- re-ETL without legacy_* source tables.
