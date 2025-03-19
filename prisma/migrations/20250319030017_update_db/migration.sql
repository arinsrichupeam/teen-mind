/*
  Warnings:

  - You are about to drop the `_profile_admintoroles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[citizenId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[citizenId]` on the table `Profile_Admin` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `_profile_admintoroles` DROP FOREIGN KEY `_Profile_AdminToRoles_A_fkey`;

-- DropForeignKey
ALTER TABLE `_profile_admintoroles` DROP FOREIGN KEY `_Profile_AdminToRoles_B_fkey`;

-- AlterTable
ALTER TABLE `profile_admin` ADD COLUMN `roleId` INTEGER NOT NULL DEFAULT 3;

-- DropTable
DROP TABLE `_profile_admintoroles`;

-- CreateIndex
CREATE UNIQUE INDEX `Profile_citizenId_key` ON `Profile`(`citizenId`);

-- CreateIndex
CREATE UNIQUE INDEX `Profile_Admin_citizenId_key` ON `Profile_Admin`(`citizenId`);

-- AddForeignKey
ALTER TABLE `Profile_Admin` ADD CONSTRAINT `Profile_Admin_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
