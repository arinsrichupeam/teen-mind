-- Session report on TreatmentNote; retire PsychRisk.NONE (ADR 0009)

-- Clear retired PsychRisk.NONE before shrinking enum
UPDATE `TreatmentNote` SET `psychRisk` = NULL WHERE `psychRisk` = 'NONE';

ALTER TABLE `TreatmentNote`
  MODIFY `psychRisk` ENUM('LOW', 'MODERATE', 'HIGH') NULL;

ALTER TABLE `TreatmentNote`
  ADD COLUMN `serviceEndedAt` DATETIME(3) NULL AFTER `scheduleTelemed`,
  ADD COLUMN `sessionSelfHarmRisk` ENUM('FOUND', 'NOT_FOUND', 'NOT_ASSESSABLE') NULL AFTER `note`,
  ADD COLUMN `presentingTopics` JSON NULL AFTER `psychRisk`,
  ADD COLUMN `presentingTopicsOther` TEXT NULL AFTER `presentingTopics`,
  ADD COLUMN `interventions` JSON NULL AFTER `presentingTopicsOther`,
  ADD COLUMN `interventionsOther` TEXT NULL AFTER `interventions`,
  ADD COLUMN `sessionOutcome` ENUM('IMPROVED', 'WORSENED', 'UNCHANGED', 'NOT_ASSESSABLE') NULL AFTER `interventionsOther`,
  ADD COLUMN `afterCarePlan` ENUM('END_FOLLOWUP', 'PSYCHOLOGIST_FOLLOWUP', 'PSYCHIATRIST', 'TRANSFER_FACILITY', 'TRANSFER_EMERGENCY', 'OTHER') NULL AFTER `sessionOutcome`,
  ADD COLUMN `afterCarePlanOther` TEXT NULL AFTER `afterCarePlan`;
