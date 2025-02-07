/*
  Warnings:

  - You are about to alter the column `latitude` on the `questions_master` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `longitude` on the `questions_master` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `questions_master` MODIFY `latitude` DOUBLE NULL,
    MODIFY `longitude` DOUBLE NULL;
