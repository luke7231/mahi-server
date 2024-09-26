/*
  Warnings:

  - A unique constraint covering the columns `[contactNumber]` on the table `seller` will be added. If there are existing duplicate values, this will fail.
  - Made the column `contactNumber` on table `seller` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `seller` MODIFY `contactNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `seller_contactNumber_key` ON `seller`(`contactNumber`);
