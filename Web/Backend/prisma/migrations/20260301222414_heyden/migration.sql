/*
  Warnings:

  - You are about to drop the `Ajuste_Inventario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Ajuste_Inventario` DROP FOREIGN KEY `Ajuste_Inventario_id_stock_bodega_fkey`;

-- DropForeignKey
ALTER TABLE `Ajuste_Inventario` DROP FOREIGN KEY `Ajuste_Inventario_id_usuario_fkey`;

-- DropTable
DROP TABLE `Ajuste_Inventario`;
