/*
  Warnings:

  - Added the required column `alert` to the `Profile_Admin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `profile_admin` ADD COLUMN `alert` BOOLEAN NOT NULL;
