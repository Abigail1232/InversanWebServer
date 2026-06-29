/*
  Warnings:

  - Added the required column `alto_rin` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ancho_rin` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Producto` ADD COLUMN `alto_rin` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `ancho_rin` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `version` VARCHAR(25) NOT NULL,
    MODIFY `estado` BOOLEAN NULL DEFAULT true;
