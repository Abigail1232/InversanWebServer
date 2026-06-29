/*
  Warnings:

  - You are about to alter the column `lonas` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(6,2)`.
  - You are about to alter the column `rin` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(6,2)`.
  - You are about to alter the column `profundidad` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to alter the column `alto_rin` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,2)`.
  - You are about to alter the column `ancho_rin` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,2)`.

*/
-- AlterTable
ALTER TABLE `Producto` MODIFY `lonas` DECIMAL(6, 2) NOT NULL,
    MODIFY `rin` DECIMAL(6, 2) NOT NULL,
    MODIFY `profundidad` DECIMAL(65, 30) NOT NULL,
    MODIFY `alto_rin` DECIMAL(6, 2) NOT NULL,
    MODIFY `ancho_rin` DECIMAL(6, 2) NOT NULL;
