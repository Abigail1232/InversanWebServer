-- AlterTable
ALTER TABLE `Producto_Visitas` ADD COLUMN `es_invitado` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `es_retorno` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `id_sesion` VARCHAR(255) NULL,
    ADD COLUMN `id_sucursal` INTEGER NULL,
    ADD COLUMN `id_usuario` INTEGER NULL,
    MODIFY `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `Busqueda_Interna` (
    `id_busqueda` INTEGER NOT NULL AUTO_INCREMENT,
    `termino` VARCHAR(255) NOT NULL,
    `id_usuario` INTEGER NULL,
    `id_sesion` VARCHAR(255) NULL,
    `tuvo_resultado` BOOLEAN NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_busqueda`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Producto_Visitas` ADD CONSTRAINT `Producto_Visitas_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Visitas` ADD CONSTRAINT `Producto_Visitas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Busqueda_Interna` ADD CONSTRAINT `Busqueda_Interna_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;
