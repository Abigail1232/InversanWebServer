/*
  Warnings:

  - You are about to drop the column `imagen_3d` on the `Producto_Imagen` table. All the data in the column will be lost.
  - Added the required column `imagen_3d` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Made the column `direccion` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lat` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lng` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Producto` ADD COLUMN `imagen_3d` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `Producto_Imagen` DROP COLUMN `imagen_3d`;

-- AlterTable
ALTER TABLE `Sucursal` MODIFY `direccion` VARCHAR(191) NOT NULL,
    MODIFY `lat` DOUBLE NOT NULL,
    MODIFY `lng` DOUBLE NOT NULL;
