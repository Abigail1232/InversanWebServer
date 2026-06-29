/*
  Warnings:

  - Made the column `direccion` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lat` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lng` on table `Sucursal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Sucursal` MODIFY `direccion` VARCHAR(191) NOT NULL,
    MODIFY `lat` DOUBLE NOT NULL,
    MODIFY `lng` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `Empleado_Sucursal` (
    `id_empleado_sucursal` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_sucursal` INTEGER NOT NULL,

    UNIQUE INDEX `Empleado_Sucursal_id_usuario_id_sucursal_key`(`id_usuario`, `id_sucursal`),
    PRIMARY KEY (`id_empleado_sucursal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Empleado_Sucursal` ADD CONSTRAINT `Empleado_Sucursal_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empleado_Sucursal` ADD CONSTRAINT `Empleado_Sucursal_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;
