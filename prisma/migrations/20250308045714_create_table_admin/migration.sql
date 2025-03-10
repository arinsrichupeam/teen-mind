/*
  Warnings:

  - You are about to drop the `_profiletoroles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_profiletoroles` DROP FOREIGN KEY `_ProfileToRoles_A_fkey`;

-- DropForeignKey
ALTER TABLE `_profiletoroles` DROP FOREIGN KEY `_ProfileToRoles_B_fkey`;

-- DropTable
DROP TABLE `_profiletoroles`;

-- CreateTable
CREATE TABLE `Profile_Admin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `citizenId` VARCHAR(191) NOT NULL,
    `prefix` INTEGER NOT NULL,
    `firstname` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NOT NULL,
    `affiliationId` INTEGER NOT NULL,
    `agency` VARCHAR(191) NOT NULL,
    `employeeTypeId` INTEGER NOT NULL,
    `professional` VARCHAR(191) NOT NULL,
    `license` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `admin_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Profile_AdminToRoles` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Profile_AdminToRoles_AB_unique`(`A`, `B`),
    INDEX `_Profile_AdminToRoles_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profile_Admin` ADD CONSTRAINT `Profile_Admin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile_Admin` ADD CONSTRAINT `Profile_Admin_affiliationId_fkey` FOREIGN KEY (`affiliationId`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile_Admin` ADD CONSTRAINT `Profile_Admin_employeeTypeId_fkey` FOREIGN KEY (`employeeTypeId`) REFERENCES `Employee_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Profile_AdminToRoles` ADD CONSTRAINT `_Profile_AdminToRoles_A_fkey` FOREIGN KEY (`A`) REFERENCES `Profile_Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Profile_AdminToRoles` ADD CONSTRAINT `_Profile_AdminToRoles_B_fkey` FOREIGN KEY (`B`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
