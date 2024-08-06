-- AlterTable
ALTER TABLE `User` ADD COLUMN `push_token` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Expo_Token` (
    `token` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Expo_Token_token_key`(`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
