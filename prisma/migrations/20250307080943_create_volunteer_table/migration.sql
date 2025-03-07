-- AlterTable
ALTER TABLE `districts` ADD COLUMN `provincesId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Districts` ADD CONSTRAINT `Districts_provincesId_fkey` FOREIGN KEY (`provincesId`) REFERENCES `Provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
