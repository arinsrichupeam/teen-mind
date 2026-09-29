-- AdminDataScope visibility (ADR 0007): one ProfileAdmin per user; optional facility/affiliation; zone anchor

-- scopeLevel
SET @col := (
  SELECT COUNT(1) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin' AND COLUMN_NAME = 'scopeLevel'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE `ProfileAdmin` ADD COLUMN `scopeLevel` ENUM(''SYSTEM'', ''ZONE'', ''AFFILIATION'', ''FACILITY'') NOT NULL DEFAULT ''FACILITY''',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- zoneId
SET @col := (
  SELECT COUNT(1) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin' AND COLUMN_NAME = 'zoneId'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE `ProfileAdmin` ADD COLUMN `zoneId` INTEGER NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Collapse duplicate userId rows (keep oldest id) before unique(userId)
DELETE `pa` FROM `ProfileAdmin` `pa`
INNER JOIN `ProfileAdmin` `keeper`
  ON `pa`.`userId` = `keeper`.`userId` AND `pa`.`id` > `keeper`.`id`;

-- Drop composite unique if still present
SET @idx := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProfileAdmin'
    AND INDEX_NAME = 'ProfileAdmin_userId_healthcareFacilityId_key'
);
SET @sql := IF(@idx > 0,
  'ALTER TABLE `ProfileAdmin` DROP INDEX `ProfileAdmin_userId_healthcareFacilityId_key`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop FKs that block nullability changes (if present)
SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_healthcareFacilityId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk > 0,
  'ALTER TABLE `ProfileAdmin` DROP FOREIGN KEY `ProfileAdmin_healthcareFacilityId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_affiliationId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk > 0,
  'ALTER TABLE `ProfileAdmin` DROP FOREIGN KEY `ProfileAdmin_affiliationId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `ProfileAdmin` MODIFY `healthcareFacilityId` VARCHAR(191) NULL;
ALTER TABLE `ProfileAdmin` MODIFY `affiliationId` INTEGER NULL;

SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_healthcareFacilityId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_affiliationId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_affiliationId_fkey` FOREIGN KEY (`affiliationId`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_zoneId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- userId: non-unique index is used by FK — drop FK, replace with UNIQUE, restore FK
SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_userId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk > 0,
  'ALTER TABLE `ProfileAdmin` DROP FOREIGN KEY `ProfileAdmin_userId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProfileAdmin'
    AND INDEX_NAME = 'ProfileAdmin_userId_idx'
);
SET @sql := IF(@idx > 0,
  'ALTER TABLE `ProfileAdmin` DROP INDEX `ProfileAdmin_userId_idx`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProfileAdmin'
    AND INDEX_NAME = 'ProfileAdmin_userId_key'
);
SET @sql := IF(@idx = 0,
  'ALTER TABLE `ProfileAdmin` ADD UNIQUE INDEX `ProfileAdmin_userId_key`(`userId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(1) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProfileAdmin'
    AND CONSTRAINT_NAME = 'ProfileAdmin_userId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProfileAdmin'
    AND INDEX_NAME = 'ProfileAdmin_zoneId_idx'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX `ProfileAdmin_zoneId_idx` ON `ProfileAdmin`(`zoneId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProfileAdmin'
    AND INDEX_NAME = 'ProfileAdmin_scopeLevel_status_idx'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX `ProfileAdmin_scopeLevel_status_idx` ON `ProfileAdmin`(`scopeLevel`, `status`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
