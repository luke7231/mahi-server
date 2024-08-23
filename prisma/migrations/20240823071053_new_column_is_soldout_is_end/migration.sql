-- AlterTable
ALTER TABLE `product` ADD COLUMN `isEnd` BOOLEAN NULL,
    ADD COLUMN `isSoldout` BOOLEAN NOT NULL DEFAULT false;
