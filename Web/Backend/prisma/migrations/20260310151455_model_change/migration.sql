/*
  Warnings:

  - You are about to drop the column `id_producto` on the `Modelo_Producto` table. All the data in the column will be lost.
  - Added the required column `id_modelo` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Modelo_Producto` DROP FOREIGN KEY `Modelo_Producto_id_producto_fkey`;

-- AlterTable
ALTER TABLE `Modelo_Producto` DROP COLUMN `id_producto`;

-- AlterTable
ALTER TABLE `Producto` ADD COLUMN `id_modelo` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo_Producto`(`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE;
