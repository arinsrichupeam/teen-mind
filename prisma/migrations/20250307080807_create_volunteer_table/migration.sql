/*
  Warnings:

  - You are about to alter the column `referent` on the `questions_master` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `questions_master` MODIFY `referent` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Questions_Master` ADD CONSTRAINT `Questions_Master_referent_fkey` FOREIGN KEY (`referent`) REFERENCES `Volunteer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
