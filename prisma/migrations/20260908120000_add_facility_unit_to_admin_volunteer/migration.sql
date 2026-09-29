-- Optional FacilityUnit on staff / volunteer registration
ALTER TABLE `ProfileAdmin` ADD COLUMN `facilityUnitId` INTEGER NULL;
ALTER TABLE `Volunteer` ADD COLUMN `facilityUnitId` INTEGER NULL;

CREATE INDEX `ProfileAdmin_facilityUnitId_idx` ON `ProfileAdmin`(`facilityUnitId`);
CREATE INDEX `Volunteer_facilityUnitId_idx` ON `Volunteer`(`facilityUnitId`);

ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_facilityUnitId_fkey` FOREIGN KEY (`facilityUnitId`) REFERENCES `FacilityUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_facilityUnitId_fkey` FOREIGN KEY (`facilityUnitId`) REFERENCES `FacilityUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
