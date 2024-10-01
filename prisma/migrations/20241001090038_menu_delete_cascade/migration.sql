-- DropForeignKey
ALTER TABLE `menu` DROP FOREIGN KEY `menu_storeId_fkey`;

-- DropForeignKey
ALTER TABLE `productMenu` DROP FOREIGN KEY `productMenu_menuId_fkey`;

-- DropForeignKey
ALTER TABLE `productMenu` DROP FOREIGN KEY `productMenu_productId_fkey`;

-- AddForeignKey
ALTER TABLE `menu` ADD CONSTRAINT `menu_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productMenu` ADD CONSTRAINT `productMenu_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productMenu` ADD CONSTRAINT `productMenu_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
