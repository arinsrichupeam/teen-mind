-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `refresh_token_expires_in` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Account_userId_key`(`userId`),
    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `citizenId` VARCHAR(191) NOT NULL,
    `prefix` INTEGER NOT NULL,
    `sex` INTEGER NOT NULL,
    `firstname` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `birthday` DATETIME(3) NOT NULL,
    `ethnicity` VARCHAR(191) NOT NULL,
    `nationality` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NOT NULL,
    `school` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Profile_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `houseNo` VARCHAR(191) NOT NULL,
    `villageNo` VARCHAR(191) NOT NULL,
    `soi` VARCHAR(191) NOT NULL,
    `road` VARCHAR(191) NOT NULL,
    `province` INTEGER NOT NULL,
    `district` INTEGER NOT NULL,
    `subdistrict` INTEGER NOT NULL,

    INDEX `Address_profileId_fkey`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContact` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NOT NULL,
    `relation` VARCHAR(191) NOT NULL,

    INDEX `Address_profileId_fkey`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provinces` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `UX_Provinces_Code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Districts` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,
    `provinceId` INTEGER NOT NULL,
    `zoneId` INTEGER NULL,

    UNIQUE INDEX `UX_Districts_Code`(`code`),
    INDEX `FK_Districts_Zone`(`zoneId`),
    INDEX `IX_Districts_ProvinceId`(`provinceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subdistricts` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,
    `districtId` INTEGER NOT NULL,

    UNIQUE INDEX `UX_Subdistricts_Code`(`code`),
    INDEX `IX_Subdistricts_DistrictId`(`districtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Questions_Master` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `referent` VARCHAR(191) NULL,
    `consult` VARCHAR(191) NULL,
    `result` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Questions_Master_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Questions_PHQA` (
    `id` VARCHAR(191) NOT NULL,
    `questions_MasterId` VARCHAR(191) NULL,
    `q1` INTEGER NOT NULL,
    `q2` INTEGER NOT NULL,
    `q3` INTEGER NOT NULL,
    `q4` INTEGER NOT NULL,
    `q5` INTEGER NOT NULL,
    `q6` INTEGER NOT NULL,
    `q7` INTEGER NOT NULL,
    `q8` INTEGER NOT NULL,
    `q9` INTEGER NOT NULL,
    `sum` INTEGER NOT NULL,

    INDEX `Questions_PHQA_questions_MasterId_idx`(`questions_MasterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Questions_2Q` (
    `id` VARCHAR(191) NOT NULL,
    `questions_MasterId` VARCHAR(191) NULL,
    `q1` INTEGER NOT NULL,
    `q2` INTEGER NOT NULL,

    INDEX `Questions_2Q_questions_MasterId_idx`(`questions_MasterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProfileToRoles` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProfileToRoles_AB_unique`(`A`, `B`),
    INDEX `_ProfileToRoles_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContact` ADD CONSTRAINT `EmergencyContact_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subdistricts` ADD CONSTRAINT `FK_Subdistricts_Districts` FOREIGN KEY (`districtId`) REFERENCES `Districts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Questions_Master` ADD CONSTRAINT `Questions_Master_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questions_PHQA` ADD CONSTRAINT `Questions_PHQA_questions_MasterId_fkey` FOREIGN KEY (`questions_MasterId`) REFERENCES `Questions_Master`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questions_2Q` ADD CONSTRAINT `Questions_2Q_questions_MasterId_fkey` FOREIGN KEY (`questions_MasterId`) REFERENCES `Questions_Master`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProfileToRoles` ADD CONSTRAINT `_ProfileToRoles_A_fkey` FOREIGN KEY (`A`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProfileToRoles` ADD CONSTRAINT `_ProfileToRoles_B_fkey` FOREIGN KEY (`B`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
