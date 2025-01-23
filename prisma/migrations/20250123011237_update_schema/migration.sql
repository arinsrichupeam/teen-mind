-- CreateTable
CREATE TABLE `districts` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameinthai` VARCHAR(150) NOT NULL,
    `provinceid` INTEGER NOT NULL,
    `zoneid` INTEGER NULL,

    UNIQUE INDEX `UX_Districts_Code`(`code`),
    INDEX `FK_Districts_Zone`(`zoneid`),
    INDEX `IX_Districts_ProvinceId`(`provinceid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provinces` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameinthai` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `UX_Provinces_Code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subdistricts` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameinthai` VARCHAR(150) NOT NULL,
    `districtid` INTEGER NOT NULL,

    UNIQUE INDEX `UX_Subdistricts_Code`(`code`),
    INDEX `IX_Subdistricts_DistrictId`(`districtid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `FK_Districts_Provinces` FOREIGN KEY (`provinceid`) REFERENCES `provinces`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subdistricts` ADD CONSTRAINT `FK_Subdistricts_Districts` FOREIGN KEY (`districtid`) REFERENCES `districts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
