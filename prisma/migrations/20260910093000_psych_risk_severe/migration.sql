-- Add PsychRisk.SEVERE (รุนแรง)

ALTER TABLE `TreatmentNote`
  MODIFY `psychRisk` ENUM('NONE', 'LOW', 'MODERATE', 'HIGH', 'SEVERE') NULL;
