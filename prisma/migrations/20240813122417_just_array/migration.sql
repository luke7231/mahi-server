/*
  Warnings:

  - You are about to drop the `orderProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `orderProduct` DROP FOREIGN KEY `orderProduct_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderProduct` DROP FOREIGN KEY `orderProduct_productId_fkey`;

-- DropTable
DROP TABLE `orderProduct`;

-- CreateTable
CREATE TABLE `_OrderToProduct` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_OrderToProduct_AB_unique`(`A`, `B`),
    INDEX `_OrderToProduct_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_OrderToProduct` ADD CONSTRAINT `_OrderToProduct_A_fkey` FOREIGN KEY (`A`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OrderToProduct` ADD CONSTRAINT `_OrderToProduct_B_fkey` FOREIGN KEY (`B`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
