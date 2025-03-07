/*
  Warnings:

  - You are about to drop the column `Agency_id` on the `volunteer` table. All the data in the column will be lost.
  - You are about to drop the `agency` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agency` to the `Volunteer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `volunteer` DROP FOREIGN KEY `Volunteer_Agency_id_fkey`;

-- DropIndex
DROP INDEX `Volunteer_Agency_id_fkey` ON `volunteer`;

-- AlterTable
ALTER TABLE `volunteer` DROP COLUMN `Agency_id`,
    ADD COLUMN `agency` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `agency`;
