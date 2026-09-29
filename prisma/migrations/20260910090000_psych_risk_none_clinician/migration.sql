-- Restore PsychRisk.NONE as clinician "no risk" on session report

ALTER TABLE `TreatmentNote`
  MODIFY `psychRisk` ENUM('NONE', 'LOW', 'MODERATE', 'HIGH') NULL;
