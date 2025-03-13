/*
  Warnings:

  - A unique constraint covering the columns `[citizenId]` on the table `Referent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Referent_citizenId_key` ON `Referent`(`citizenId`);
