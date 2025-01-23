/*
  Warnings:

  - You are about to drop the column `nameinthai` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `provinceid` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `zoneid` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `nameinthai` on the `provinces` table. All the data in the column will be lost.
  - You are about to drop the column `districtid` on the `subdistricts` table. All the data in the column will be lost.
  - You are about to drop the column `nameinthai` on the `subdistricts` table. All the data in the column will be lost.
  - Added the required column `nameInThai` to the `Districts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provinceId` to the `Districts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameInThai` to the `Provinces` table without a default value. This is not possible if the table is not empty.
  - Added the required column `districtId` to the `Subdistricts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameInThai` to the `Subdistricts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `districts` DROP FOREIGN KEY `FK_Districts_Provinces`;

-- DropForeignKey
ALTER TABLE `subdistricts` DROP FOREIGN KEY `FK_Subdistricts_Districts`;

-- DropIndex
DROP INDEX `FK_Districts_Zone` ON `districts`;

-- DropIndex
DROP INDEX `IX_Districts_ProvinceId` ON `districts`;

-- DropIndex
DROP INDEX `IX_Subdistricts_DistrictId` ON `subdistricts`;

-- AlterTable
ALTER TABLE `districts` DROP COLUMN `nameinthai`,
    DROP COLUMN `provinceid`,
    DROP COLUMN `zoneid`,
    ADD COLUMN `nameInThai` VARCHAR(150) NOT NULL,
    ADD COLUMN `provinceId` INTEGER NOT NULL,
    ADD COLUMN `zoneId` INTEGER NULL;

-- AlterTable
ALTER TABLE `provinces` DROP COLUMN `nameinthai`,
    ADD COLUMN `nameInThai` VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE `subdistricts` DROP COLUMN `districtid`,
    DROP COLUMN `nameinthai`,
    ADD COLUMN `districtId` INTEGER NOT NULL,
    ADD COLUMN `nameInThai` VARCHAR(150) NOT NULL;

-- CreateIndex
CREATE INDEX `FK_Districts_Zone` ON `Districts`(`zoneId`);

-- CreateIndex
CREATE INDEX `IX_Districts_ProvinceId` ON `Districts`(`provinceId`);

-- CreateIndex
CREATE INDEX `IX_Subdistricts_DistrictId` ON `Subdistricts`(`districtId`);

-- AddForeignKey
ALTER TABLE `Districts` ADD CONSTRAINT `FK_Districts_Provinces` FOREIGN KEY (`provinceId`) REFERENCES `Provinces`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Subdistricts` ADD CONSTRAINT `FK_Subdistricts_Districts` FOREIGN KEY (`districtId`) REFERENCES `Districts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
