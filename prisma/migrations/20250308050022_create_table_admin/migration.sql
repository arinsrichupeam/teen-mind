/*
  Warnings:

  - You are about to drop the column `prefix` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `prefix` on the `profile_admin` table. All the data in the column will be lost.
  - You are about to drop the column `prefix` on the `referent` table. All the data in the column will be lost.
  - Added the required column `prefixId` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prefixId` to the `Profile_Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prefixId` to the `Referent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `profile` DROP COLUMN `prefix`,
    ADD COLUMN `prefixId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `profile_admin` DROP COLUMN `prefix`,
    ADD COLUMN `prefixId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `referent` DROP COLUMN `prefix`,
    ADD COLUMN `prefixId` INTEGER NOT NULL;
