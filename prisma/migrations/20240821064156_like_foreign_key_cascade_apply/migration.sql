-- DropForeignKey
ALTER TABLE `like` DROP FOREIGN KEY `like_userId_fkey`;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
