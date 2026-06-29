/*
  Warnings:

  - The primary key for the `Modelo_Producto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `anio` on the `Modelo_Producto` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Modelo_Producto` table. All the data in the column will be lost.
  - You are about to drop the column `id_modelo` on the `Producto` table. All the data in the column will be lost.
  - Added the required column `id_producto` to the `Modelo_Producto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Producto` DROP FOREIGN KEY `Producto_id_modelo_fkey`;

-- AlterTable
ALTER TABLE `Modelo_Producto` DROP PRIMARY KEY,
    DROP COLUMN `anio`,
    DROP COLUMN `nombre`,
    ADD COLUMN `id_producto` INTEGER NOT NULL,
    MODIFY `id_modelo` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id_modelo`, `id_producto`);

-- AlterTable
ALTER TABLE `Producto` DROP COLUMN `id_modelo`;

-- CreateTable
CREATE TABLE `Modelo` (
    `id_modelo` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `anio` DATE NOT NULL,

    PRIMARY KEY (`id_modelo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo`(`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;
