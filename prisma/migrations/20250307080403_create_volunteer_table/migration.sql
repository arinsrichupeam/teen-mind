/*
  Warnings:

  - You are about to drop the column `Assessment` on the `questions_master` table. All the data in the column will be lost.
  - You are about to drop the column `Objective` on the `questions_master` table. All the data in the column will be lost.
  - You are about to drop the column `Plan` on the `questions_master` table. All the data in the column will be lost.
  - You are about to drop the column `Subjective` on the `questions_master` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `questions_master` DROP COLUMN `Assessment`,
    DROP COLUMN `Objective`,
    DROP COLUMN `Plan`,
    DROP COLUMN `Subjective`,
    ADD COLUMN `assessment` VARCHAR(191) NULL,
    ADD COLUMN `objective` VARCHAR(191) NULL,
    ADD COLUMN `plan` VARCHAR(191) NULL,
    ADD COLUMN `schedule_telemed` DATETIME(3) NULL,
    ADD COLUMN `subjective` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Volunteer` (
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
    `Agency_id` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affiliation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agency` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `volunteerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Volunteer_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_volunteer_type_id_fkey` FOREIGN KEY (`volunteer_type_id`) REFERENCES `Volunteer_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_employee_type_id_fkey` FOREIGN KEY (`employee_type_id`) REFERENCES `Employee_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_affiliation_id_fkey` FOREIGN KEY (`affiliation_id`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_Agency_id_fkey` FOREIGN KEY (`Agency_id`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
