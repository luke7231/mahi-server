/*
  Warnings:

  - You are about to alter the column `priceRange` on the `uncontracted_store` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `uncontracted_store` MODIFY `img` VARCHAR(500) NULL,
    MODIFY `mainMenuImg1` VARCHAR(500) NULL,
    MODIFY `mainMenuImg2` VARCHAR(500) NULL,
    MODIFY `priceRange` VARCHAR(50) NULL;
