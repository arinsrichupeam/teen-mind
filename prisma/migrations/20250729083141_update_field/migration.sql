/*
  Warnings:

  - You are about to drop the column `userId` on the `questions_master` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `screeningDate` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `questions_master` DROP FOREIGN KEY `Questions_Master_userId_fkey`;

-- DropIndex
DROP INDEX `Questions_Master_userId_fkey` ON `questions_master`;

-- AlterTable
ALTER TABLE `profile` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `questions_master` DROP COLUMN `userId`,
    MODIFY `assessment` TEXT NULL,
    MODIFY `objective` TEXT NULL,
    MODIFY `plan` TEXT NULL,
    MODIFY `subjective` TEXT NULL;

-- AlterTable
ALTER TABLE `school` ADD COLUMN `screeningDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `image` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Profile_userId_key` ON `Profile`(`userId`);
