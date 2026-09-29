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
    INDEX `Session_expires_idx`(`expires`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(100) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` TEXT NULL,
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
    `refreshToken` TEXT NULL,
    `accessToken` TEXT NULL,
    `expiresAt` INTEGER NULL,
    `tokenType` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `idToken` TEXT NULL,
    `sessionState` VARCHAR(191) NULL,
    `refreshTokenExpiresIn` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prefix` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prefix_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `citizenId` VARCHAR(13) NOT NULL,
    `prefixId` INTEGER NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'UNSPECIFIED') NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `ethnicity` VARCHAR(50) NOT NULL,
    `nationality` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `hn` VARCHAR(50) NULL,
    `mainInsclCode` VARCHAR(20) NULL,
    `mainInsclName` VARCHAR(150) NULL,
    `subInsclCode` VARCHAR(20) NULL,
    `subInsclName` VARCHAR(150) NULL,
    `hmainCode` VARCHAR(10) NULL,
    `hmainName` VARCHAR(200) NULL,
    `hsubCode` VARCHAR(10) NULL,
    `hsubName` VARCHAR(200) NULL,
    `nhsoVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `schoolId` INTEGER NULL,
    `gradeYear` INTEGER NULL,
    `isStudent` BOOLEAN NOT NULL DEFAULT false,
    `healthcareFacilityId` VARCHAR(191) NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    UNIQUE INDEX `Profile_citizenId_key`(`citizenId`),
    INDEX `Profile_prefixId_idx`(`prefixId`),
    INDEX `Profile_schoolId_idx`(`schoolId`),
    INDEX `Profile_healthcareFacilityId_idx`(`healthcareFacilityId`),
    INDEX `Profile_mainInsclCode_idx`(`mainInsclCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfileAdmin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `citizenId` VARCHAR(13) NOT NULL,
    `prefixId` INTEGER NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `affiliationId` INTEGER NOT NULL,
    `employeeTypeId` INTEGER NOT NULL,
    `profession` VARCHAR(100) NULL,
    `license` VARCHAR(50) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    `receiveAlert` BOOLEAN NOT NULL DEFAULT false,
    `roleId` INTEGER NOT NULL,
    `healthcareFacilityId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProfileAdmin_citizenId_key`(`citizenId`),
    INDEX `ProfileAdmin_userId_idx`(`userId`),
    INDEX `ProfileAdmin_prefixId_idx`(`prefixId`),
    INDEX `ProfileAdmin_healthcareFacilityId_status_idx`(`healthcareFacilityId`, `status`),
    INDEX `ProfileAdmin_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `ProfileAdmin_affiliationId_idx`(`affiliationId`),
    INDEX `ProfileAdmin_employeeTypeId_idx`(`employeeTypeId`),
    INDEX `ProfileAdmin_roleId_idx`(`roleId`),
    UNIQUE INDEX `ProfileAdmin_userId_healthcareFacilityId_key`(`userId`, `healthcareFacilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `houseNo` VARCHAR(50) NOT NULL,
    `villageNo` VARCHAR(50) NULL,
    `soi` VARCHAR(100) NULL,
    `road` VARCHAR(100) NULL,
    `postalCode` VARCHAR(5) NULL,
    `provinceId` INTEGER NOT NULL,
    `districtId` INTEGER NOT NULL,
    `subdistrictId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_profileId_idx`(`profileId`),
    INDEX `Address_provinceId_idx`(`provinceId`),
    INDEX `Address_districtId_idx`(`districtId`),
    INDEX `Address_subdistrictId_idx`(`subdistrictId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_code_key`(`code`),
    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContact` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relation` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmergencyContact_profileId_idx`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Province` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Province_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `District` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,
    `provinceId` INTEGER NOT NULL,
    `zoneId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `District_code_key`(`code`),
    INDEX `District_zoneId_idx`(`zoneId`),
    INDEX `District_provinceId_idx`(`provinceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subdistrict` (
    `id` INTEGER NOT NULL,
    `code` INTEGER NOT NULL,
    `nameInThai` VARCHAR(150) NOT NULL,
    `districtId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subdistrict_code_key`(`code`),
    INDEX `Subdistrict_districtId_idx`(`districtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `healthcareFacilityId` VARCHAR(191) NULL,
    `assigneeAdminId` VARCHAR(191) NULL,
    `transferToFacilityId` VARCHAR(191) NULL,
    `transferNote` TEXT NULL,
    `transferRequestedAt` DATETIME(3) NULL,
    `volunteerId` INTEGER NULL,
    `schoolScreeningId` INTEGER NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `package` ENUM('BURNOUT', 'DEPRESSION', 'FULL') NOT NULL DEFAULT 'FULL',
    `result` ENUM('NEGATIVE', 'POSITIVE_LOW', 'POSITIVE_MODERATE', 'POSITIVE_HIGH', 'POSITIVE_SEVERE', 'INCOMPLETE') NOT NULL,
    `closeCaseReason` TEXT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'TRANSFER_PENDING', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Case_profileId_status_createdAt_idx`(`profileId`, `status`, `createdAt`),
    INDEX `Case_healthcareFacilityId_status_idx`(`healthcareFacilityId`, `status`),
    INDEX `Case_transferToFacilityId_status_idx`(`transferToFacilityId`, `status`),
    INDEX `Case_assigneeAdminId_status_idx`(`assigneeAdminId`, `status`),
    INDEX `Case_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `Case_result_status_idx`(`result`, `status`),
    INDEX `Case_volunteerId_idx`(`volunteerId`),
    INDEX `Case_schoolScreeningId_idx`(`schoolScreeningId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseFeedback` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `overallRating` INTEGER NOT NULL,
    `serviceRating` INTEGER NULL,
    `systemRating` INTEGER NULL,
    `comment` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseFeedback_caseId_key`(`caseId`),
    INDEX `CaseFeedback_caseId_idx`(`caseId`),
    INDEX `CaseFeedback_overallRating_idx`(`overallRating`),
    INDEX `CaseFeedback_submittedAt_idx`(`submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `fromFacilityId` VARCHAR(191) NULL,
    `toFacilityId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requestNote` TEXT NULL,
    `responseNote` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,

    INDEX `CaseTransfer_caseId_requestedAt_idx`(`caseId`, `requestedAt`),
    INDEX `CaseTransfer_toFacilityId_status_requestedAt_idx`(`toFacilityId`, `status`, `requestedAt`),
    INDEX `CaseTransfer_fromFacilityId_status_requestedAt_idx`(`fromFacilityId`, `status`, `requestedAt`),
    INDEX `CaseTransfer_status_requestedAt_idx`(`status`, `requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreatmentNote` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `authorAdminId` VARCHAR(191) NULL,
    `consult` VARCHAR(100) NULL,
    `scheduleTelemed` DATETIME(3) NULL,
    `serviceEndedAt` DATETIME(3) NULL,
    `unreachable` BOOLEAN NOT NULL DEFAULT false,
    `subjective` TEXT NULL,
    `objective` TEXT NULL,
    `assessment` TEXT NULL,
    `plan` TEXT NULL,
    `note` TEXT NULL,
    `sessionSelfHarmRisk` ENUM('FOUND', 'NOT_FOUND', 'NOT_ASSESSABLE') NULL,
    `psychRisk` ENUM('NONE', 'LOW', 'MODERATE', 'HIGH', 'SEVERE') NULL,
    `presentingTopics` JSON NULL,
    `presentingTopicsOther` TEXT NULL,
    `interventions` JSON NULL,
    `interventionsOther` TEXT NULL,
    `sessionOutcome` ENUM('IMPROVED', 'WORSENED', 'UNCHANGED', 'NOT_ASSESSABLE') NULL,
    `afterCarePlan` ENUM('END_FOLLOWUP', 'PSYCHOLOGIST_FOLLOWUP', 'PSYCHIATRIST', 'TRANSFER_FACILITY', 'TRANSFER_EMERGENCY', 'OTHER') NULL,
    `afterCarePlanOther` TEXT NULL,
    `followUp` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TreatmentNote_authorAdminId_idx`(`authorAdminId`),
    UNIQUE INDEX `TreatmentNote_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionProblem` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `familyRelation` INTEGER NOT NULL DEFAULT 0,
    `familyStudyPressure` INTEGER NOT NULL DEFAULT 0,
    `familyConflict` INTEGER NOT NULL DEFAULT 0,
    `familyAbuse` INTEGER NOT NULL DEFAULT 0,
    `familyLoss` INTEGER NOT NULL DEFAULT 0,
    `socialFriendIssue` INTEGER NOT NULL DEFAULT 0,
    `socialBullying` INTEGER NOT NULL DEFAULT 0,
    `socialBreakup` INTEGER NOT NULL DEFAULT 0,
    `socialTeacher` INTEGER NOT NULL DEFAULT 0,
    `socialAssault` INTEGER NOT NULL DEFAULT 0,
    `studyStress` INTEGER NOT NULL DEFAULT 0,
    `studyNoMotivation` INTEGER NOT NULL DEFAULT 0,
    `studyBurnout` INTEGER NOT NULL DEFAULT 0,
    `studyTimeManage` INTEGER NOT NULL DEFAULT 0,
    `studyHomeworkLoad` INTEGER NOT NULL DEFAULT 0,
    `studyExamAnxiety` INTEGER NOT NULL DEFAULT 0,
    `financeFamilyIssue` INTEGER NOT NULL DEFAULT 0,
    `lifestyleSocialMediaOveruse` INTEGER NOT NULL DEFAULT 0,
    `lifestyleGamingAddiction` INTEGER NOT NULL DEFAULT 0,
    `lifestyleSubstanceUse` INTEGER NOT NULL DEFAULT 0,
    `lifestyleEatingIssue` INTEGER NOT NULL DEFAULT 0,
    `lifestyleBodyImageConcern` INTEGER NOT NULL DEFAULT 0,
    `lifestyleInsomnia` INTEGER NOT NULL DEFAULT 0,
    `sum` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionProblem_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question2Q` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `q1` INTEGER NOT NULL,
    `q2` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Question2Q_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionPhqa` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
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
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionPhqa_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionPhqaAddon` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `q1` INTEGER NOT NULL,
    `q2` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionPhqaAddon_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question9Q` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `q1` INTEGER NOT NULL DEFAULT 0,
    `q2` INTEGER NOT NULL DEFAULT 0,
    `q3` INTEGER NOT NULL DEFAULT 0,
    `q4` INTEGER NOT NULL DEFAULT 0,
    `q5` INTEGER NOT NULL DEFAULT 0,
    `q6` INTEGER NOT NULL DEFAULT 0,
    `q7` INTEGER NOT NULL DEFAULT 0,
    `q8` INTEGER NOT NULL DEFAULT 0,
    `q9` INTEGER NOT NULL DEFAULT 0,
    `sum` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Question9Q_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question8Q` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `q1` INTEGER NOT NULL DEFAULT 0,
    `q2` INTEGER NOT NULL DEFAULT 0,
    `q3` INTEGER NOT NULL DEFAULT 0,
    `q4` INTEGER NOT NULL DEFAULT 0,
    `q5` INTEGER NOT NULL DEFAULT 0,
    `q6` INTEGER NOT NULL DEFAULT 0,
    `q7` INTEGER NOT NULL DEFAULT 0,
    `q8` INTEGER NOT NULL DEFAULT 0,
    `q8Addon` INTEGER NOT NULL DEFAULT 0,
    `sum` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Question8Q_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionMbiGs` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `q1` INTEGER NOT NULL DEFAULT 0,
    `q2` INTEGER NOT NULL DEFAULT 0,
    `q3` INTEGER NOT NULL DEFAULT 0,
    `q4` INTEGER NOT NULL DEFAULT 0,
    `q5` INTEGER NOT NULL DEFAULT 0,
    `q6` INTEGER NOT NULL DEFAULT 0,
    `q7` INTEGER NOT NULL DEFAULT 0,
    `q8` INTEGER NOT NULL DEFAULT 0,
    `q9` INTEGER NOT NULL DEFAULT 0,
    `q10` INTEGER NOT NULL DEFAULT 0,
    `q11` INTEGER NOT NULL DEFAULT 0,
    `q12` INTEGER NOT NULL DEFAULT 0,
    `q13` INTEGER NOT NULL DEFAULT 0,
    `q14` INTEGER NOT NULL DEFAULT 0,
    `q15` INTEGER NOT NULL DEFAULT 0,
    `q16` INTEGER NOT NULL DEFAULT 0,
    `exhaustion` INTEGER NOT NULL DEFAULT 0,
    `cynicism` INTEGER NOT NULL DEFAULT 0,
    `professionalEfficacy` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionMbiGs_caseId_round_key`(`caseId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `School` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `districtId` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `screeningDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `School_districtId_idx`(`districtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthcareFacility` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` TEXT NULL,
    `provinceId` INTEGER NOT NULL,
    `districtId` INTEGER NOT NULL,
    `subdistrictId` INTEGER NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `affiliationId` INTEGER NOT NULL,
    `zoneId` INTEGER NULL,
    `status` ENUM('INACTIVE', 'ACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HealthcareFacility_provinceId_idx`(`provinceId`),
    INDEX `HealthcareFacility_districtId_idx`(`districtId`),
    INDEX `HealthcareFacility_subdistrictId_idx`(`subdistrictId`),
    INDEX `HealthcareFacility_affiliationId_idx`(`affiliationId`),
    INDEX `HealthcareFacility_zoneId_idx`(`zoneId`),
    INDEX `HealthcareFacility_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `facilitatorFacilityId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Zone_name_key`(`name`),
    UNIQUE INDEX `Zone_facilitatorFacilityId_key`(`facilitatorFacilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacilityUnit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `healthcareFacilityId` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FacilityUnit_healthcareFacilityId_idx`(`healthcareFacilityId`),
    UNIQUE INDEX `FacilityUnit_healthcareFacilityId_name_key`(`healthcareFacilityId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolScreening` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` INTEGER NOT NULL,
    `round` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SchoolScreening_schoolId_round_key`(`schoolId`, `round`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Volunteer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `citizenId` VARCHAR(13) NOT NULL,
    `prefixId` INTEGER NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `volunteerTypeId` INTEGER NOT NULL,
    `employeeTypeId` INTEGER NOT NULL,
    `affiliationId` INTEGER NOT NULL,
    `healthcareFacilityId` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Volunteer_citizenId_key`(`citizenId`),
    UNIQUE INDEX `Volunteer_email_key`(`email`),
    INDEX `Volunteer_prefixId_idx`(`prefixId`),
    INDEX `Volunteer_volunteerTypeId_idx`(`volunteerTypeId`),
    INDEX `Volunteer_employeeTypeId_idx`(`employeeTypeId`),
    INDEX `Volunteer_affiliationId_idx`(`affiliationId`),
    INDEX `Volunteer_healthcareFacilityId_idx`(`healthcareFacilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affiliation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Affiliation_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VolunteerType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VolunteerType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actorType` ENUM('USER', 'ADMIN', 'VOLUNTEER', 'SYSTEM') NOT NULL,
    `actorId` VARCHAR(64) NULL,
    `actorLabel` VARCHAR(200) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'STATUS_CHANGE') NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `caseId` VARCHAR(64) NULL,
    `profileId` VARCHAR(64) NULL,
    `facilityId` VARCHAR(64) NULL,
    `summary` VARCHAR(500) NOT NULL,
    `diff` JSON NULL,
    `meta` JSON NULL,

    INDEX `AuditLog_occurredAt_idx`(`occurredAt`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_actorId_occurredAt_idx`(`actorId`, `occurredAt`),
    INDEX `AuditLog_caseId_occurredAt_idx`(`caseId`, `occurredAt`),
    INDEX `AuditLog_profileId_occurredAt_idx`(`profileId`, `occurredAt`),
    INDEX `AuditLog_facilityId_occurredAt_idx`(`facilityId`, `occurredAt`),
    INDEX `AuditLog_action_occurredAt_idx`(`action`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_prefixId_fkey` FOREIGN KEY (`prefixId`) REFERENCES `Prefix`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_prefixId_fkey` FOREIGN KEY (`prefixId`) REFERENCES `Prefix`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_affiliationId_fkey` FOREIGN KEY (`affiliationId`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_employeeTypeId_fkey` FOREIGN KEY (`employeeTypeId`) REFERENCES `EmployeeType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileAdmin` ADD CONSTRAINT `ProfileAdmin_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `District`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_subdistrictId_fkey` FOREIGN KEY (`subdistrictId`) REFERENCES `Subdistrict`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContact` ADD CONSTRAINT `EmergencyContact_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `District` ADD CONSTRAINT `District_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `District` ADD CONSTRAINT `District_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subdistrict` ADD CONSTRAINT `Subdistrict_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `District`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `Volunteer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_schoolScreeningId_fkey` FOREIGN KEY (`schoolScreeningId`) REFERENCES `SchoolScreening`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_transferToFacilityId_fkey` FOREIGN KEY (`transferToFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_assigneeAdminId_fkey` FOREIGN KEY (`assigneeAdminId`) REFERENCES `ProfileAdmin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseFeedback` ADD CONSTRAINT `CaseFeedback_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_fromFacilityId_fkey` FOREIGN KEY (`fromFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseTransfer` ADD CONSTRAINT `CaseTransfer_toFacilityId_fkey` FOREIGN KEY (`toFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentNote` ADD CONSTRAINT `TreatmentNote_authorAdminId_fkey` FOREIGN KEY (`authorAdminId`) REFERENCES `ProfileAdmin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentNote` ADD CONSTRAINT `TreatmentNote_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionProblem` ADD CONSTRAINT `QuestionProblem_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question2Q` ADD CONSTRAINT `Question2Q_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionPhqa` ADD CONSTRAINT `QuestionPhqa_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionPhqaAddon` ADD CONSTRAINT `QuestionPhqaAddon_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question9Q` ADD CONSTRAINT `Question9Q_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question8Q` ADD CONSTRAINT `Question8Q_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionMbiGs` ADD CONSTRAINT `QuestionMbiGs_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `School` ADD CONSTRAINT `School_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `District`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthcareFacility` ADD CONSTRAINT `HealthcareFacility_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthcareFacility` ADD CONSTRAINT `HealthcareFacility_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `District`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthcareFacility` ADD CONSTRAINT `HealthcareFacility_subdistrictId_fkey` FOREIGN KEY (`subdistrictId`) REFERENCES `Subdistrict`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthcareFacility` ADD CONSTRAINT `HealthcareFacility_affiliationId_fkey` FOREIGN KEY (`affiliationId`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthcareFacility` ADD CONSTRAINT `HealthcareFacility_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zone` ADD CONSTRAINT `Zone_facilitatorFacilityId_fkey` FOREIGN KEY (`facilitatorFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacilityUnit` ADD CONSTRAINT `FacilityUnit_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolScreening` ADD CONSTRAINT `SchoolScreening_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_prefixId_fkey` FOREIGN KEY (`prefixId`) REFERENCES `Prefix`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_volunteerTypeId_fkey` FOREIGN KEY (`volunteerTypeId`) REFERENCES `VolunteerType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_employeeTypeId_fkey` FOREIGN KEY (`employeeTypeId`) REFERENCES `EmployeeType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_affiliationId_fkey` FOREIGN KEY (`affiliationId`) REFERENCES `Affiliation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Volunteer` ADD CONSTRAINT `Volunteer_healthcareFacilityId_fkey` FOREIGN KEY (`healthcareFacilityId`) REFERENCES `HealthcareFacility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

