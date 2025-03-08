/*
  Warnings:

  - You are about to drop the column `volunteerId` on the `employee_type` table. All the data in the column will be lost.
  - You are about to drop the column `referent` on the `questions_master` table. All the data in the column will be lost.
  - You are about to drop the `volunteer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `questions_master` DROP FOREIGN KEY `Questions_Master_referent_fkey`;

-- DropForeignKey
ALTER TABLE `volunteer` DROP FOREIGN KEY `Volunteer_affiliation_id_fkey`;

-- DropForeignKey
ALTER TABLE `volunteer` DROP FOREIGN KEY `Volunteer_employee_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `volunteer` DROP FOREIGN KEY `Volunteer_volunteer_type_id_fkey`;

-- DropIndex
DROP INDEX `Questions_Master_referent_fkey` ON `questions_master`;

-- AlterTable
ALTER TABLE `affiliation` MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `employee_type` DROP COLUMN `volunteerId`,
    MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `questions_master` DROP COLUMN `referent`,
    ADD COLUMN `referentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `volunteer_type` MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE `volunteer`;

-- CreateTable
CREATE TABLE `Referent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `citizenId` VARCHAR(191) NOT NULL,
    `prefix` INTEGER NOT NULL,
    `firstname` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NOT NULL,
    `volunteer_type_id` INTEGER NOT NULL,
    `employee_type_id` INTEGER NOT NULL,
    `affiliation_id` INTEGER NOT NULL,
    `agency` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Questions_Master` ADD CONSTRAINT `Questions_Master_referentId_fkey` FOREIGN KEY (`referentId`) REFERENCES `Referent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referent` ADD CONSTRAINT `Referent_volunteer_type_id_fkey` FOREIGN KEY (`volunteer_type_id`) REFERENCES `Volunteer_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referent` ADD CONSTRAINT `Referent_employee_type_id_fkey` FOREIGN KEY (`employee_type_id`) REFERENCES `Employee_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referent` ADD CONSTRAINT `Referent_affiliation_id_fkey` FOREIGN KEY (`affiliation_id`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
