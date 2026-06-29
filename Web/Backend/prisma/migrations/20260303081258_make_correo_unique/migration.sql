/*
  Warnings:

  - A unique constraint covering the columns `[correo]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Producto` MODIFY `estado` BOOLEAN NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_correo_key` ON `Usuario`(`correo`);
