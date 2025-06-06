/*
  Warnings:

  - Added the required column `profileId` to the `Questions_Master` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `questions_master` DROP FOREIGN KEY `Questions_Master_userId_fkey`;

-- DropIndex
DROP INDEX `Questions_Master_userId_idx` ON `questions_master`;

-- AlterTable
ALTER TABLE `questions_master` ADD COLUMN `profileId` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Questions_Master_profileId_idx` ON `Questions_Master`(`profileId`);

-- AddForeignKey
ALTER TABLE `Questions_Master` ADD CONSTRAINT `Questions_Master_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questions_Master` ADD CONSTRAINT `Questions_Master_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
