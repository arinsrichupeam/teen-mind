/*
  Warnings:

  - You are about to alter the column `latitude` on the `questions_master` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,7)`.
  - You are about to alter the column `longitude` on the `questions_master` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,7)`.

*/
-- AlterTable
ALTER TABLE `questions_master` MODIFY `latitude` DECIMAL(10, 7) NULL,
    MODIFY `longitude` DECIMAL(10, 7) NULL;
