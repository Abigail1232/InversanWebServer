/*
  Warnings:

  - You are about to drop the column `id_sucursal` on the `Factura` table. All the data in the column will be lost.
  - You are about to drop the column `id_usuario` on the `Factura` table. All the data in the column will be lost.
  - You are about to drop the column `apellido_cliente` on the `Pedido_Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_cliente` on the `Pedido_Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `costo_unitario` on the `Producto_Ingreso_Detalle` table. All the data in the column will be lost.
  - You are about to drop the column `id_producto` on the `Promocion` table. All the data in the column will be lost.
  - You are about to drop the column `Primer_apellido` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `Primer_nombre` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `Segundo_apellido` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `Segundo_nombre` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuario]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Made the column `id_usuario` on table `Ajuste_Inventario` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `id_pedido_usuario` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_completo` to the `Pedido_Usuario` table without a default value. This is not possible if the table is not empty.
  - Made the column `id_pedido` on table `Pedido_Usuario` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `accion` to the `Producto_Ingreso_Detalle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primer_apellido` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primer_nombre` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Made the column `activo` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_rol` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Ajuste_Inventario` DROP FOREIGN KEY `Ajuste_Inventario_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `Factura` DROP FOREIGN KEY `Factura_id_sucursal_fkey`;

-- DropForeignKey
ALTER TABLE `Factura` DROP FOREIGN KEY `Factura_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `Pedido_Asignacion` DROP FOREIGN KEY `Pedido_Asignacion_asignado_por_fkey`;

-- DropForeignKey
ALTER TABLE `Pedido_Asignacion` DROP FOREIGN KEY `Pedido_Asignacion_id_repartidor_fkey`;

-- DropForeignKey
ALTER TABLE `Pedido_Usuario` DROP FOREIGN KEY `Pedido_Usuario_id_pedido_fkey`;

-- DropForeignKey
ALTER TABLE `Promocion` DROP FOREIGN KEY `Promocion_id_producto_fkey`;

-- DropForeignKey
ALTER TABLE `Sucursal` DROP FOREIGN KEY `Sucursal_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `Usuario_id_rol_fkey`;

-- AlterTable
ALTER TABLE `Ajuste_Inventario` MODIFY `id_usuario` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Factura` DROP COLUMN `id_sucursal`,
    DROP COLUMN `id_usuario`,
    ADD COLUMN `id_pedido_usuario` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Pedido_Asignacion` MODIFY `id_repartidor` INTEGER NULL,
    MODIFY `asignado_por` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pedido_Usuario` DROP COLUMN `apellido_cliente`,
    DROP COLUMN `nombre_cliente`,
    ADD COLUMN `nombre_completo` VARCHAR(80) NOT NULL,
    MODIFY `id_pedido` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Producto_Ingreso` MODIFY `observaciones` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Producto_Ingreso_Detalle` DROP COLUMN `costo_unitario`,
    ADD COLUMN `accion` ENUM('incremento', 'decremento') NOT NULL;

-- AlterTable
ALTER TABLE `Promocion` DROP COLUMN `id_producto`;

-- AlterTable
ALTER TABLE `Sucursal` MODIFY `id_usuario` INTEGER NULL;

-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `Primer_apellido`,
    DROP COLUMN `Primer_nombre`,
    DROP COLUMN `Segundo_apellido`,
    DROP COLUMN `Segundo_nombre`,
    ADD COLUMN `primer_apellido` VARCHAR(20) NOT NULL,
    ADD COLUMN `primer_nombre` VARCHAR(20) NOT NULL,
    ADD COLUMN `segundo_apellido` VARCHAR(20) NULL,
    ADD COLUMN `segundo_nombre` VARCHAR(20) NULL,
    MODIFY `activo` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `id_rol` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Devolucion` (
    `id_devolucion` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_devolucion` VARCHAR(50) NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `tipo` ENUM('parcial', 'total') NOT NULL,
    `estado` ENUM('solicitada', 'aprobada', 'rechazada', 'procesada') NOT NULL,
    `monto_subtotal` DECIMAL(10, 2) NOT NULL,
    `monto_iva` DECIMAL(10, 2) NOT NULL,
    `monto_total` DECIMAL(10, 2) NOT NULL,
    `id_factura` INTEGER NOT NULL,
    `id_usuario_registra` INTEGER NOT NULL,
    `id_usuario_aprueba` INTEGER NULL,

    UNIQUE INDEX `Devolucion_numero_devolucion_key`(`numero_devolucion`),
    PRIMARY KEY (`id_devolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Devolucion_Detalle` (
    `id_devolucion_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_devolucion` INTEGER NOT NULL,
    `id_factura_detalle` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_devolucion_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_usuario_key` ON `Usuario`(`usuario`);

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sucursal` ADD CONSTRAINT `Sucursal_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Asignacion` ADD CONSTRAINT `Pedido_Asignacion_id_repartidor_fkey` FOREIGN KEY (`id_repartidor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Asignacion` ADD CONSTRAINT `Pedido_Asignacion_asignado_por_fkey` FOREIGN KEY (`asignado_por`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ajuste_Inventario` ADD CONSTRAINT `Ajuste_Inventario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_pedido_usuario_fkey` FOREIGN KEY (`id_pedido_usuario`) REFERENCES `Pedido_Usuario`(`id_pedido_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Usuario` ADD CONSTRAINT `Pedido_Usuario_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido`(`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devolucion` ADD CONSTRAINT `Devolucion_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `Factura`(`id_factura`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devolucion` ADD CONSTRAINT `Devolucion_id_usuario_registra_fkey` FOREIGN KEY (`id_usuario_registra`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devolucion` ADD CONSTRAINT `Devolucion_id_usuario_aprueba_fkey` FOREIGN KEY (`id_usuario_aprueba`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devolucion_Detalle` ADD CONSTRAINT `Devolucion_Detalle_id_devolucion_fkey` FOREIGN KEY (`id_devolucion`) REFERENCES `Devolucion`(`id_devolucion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devolucion_Detalle` ADD CONSTRAINT `Devolucion_Detalle_id_factura_detalle_fkey` FOREIGN KEY (`id_factura_detalle`) REFERENCES `Factura_Detalle`(`id_factura_detalle`) ON DELETE RESTRICT ON UPDATE CASCADE;
