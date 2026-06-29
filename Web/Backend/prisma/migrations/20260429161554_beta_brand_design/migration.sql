/*
  Warnings:

  - Added the required column `id_diseno` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Marca` MODIFY `activo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Producto` ADD COLUMN `id_diseno` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Diseno` (
    `id_diseno` INTEGER NOT NULL AUTO_INCREMENT,
    `id_marca` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_actualizacion` DATETIME(3) NOT NULL,
    `imagen_url` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_diseno`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_id_diseno_fkey` FOREIGN KEY (`id_diseno`) REFERENCES `Diseno`(`id_diseno`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Diseno` ADD CONSTRAINT `Diseno_id_marca_fkey` FOREIGN KEY (`id_marca`) REFERENCES `Marca`(`id_marca`) ON DELETE RESTRICT ON UPDATE CASCADE;
