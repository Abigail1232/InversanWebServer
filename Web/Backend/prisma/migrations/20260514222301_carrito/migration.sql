-- CreateTable
CREATE TABLE `Carrito` (
    `id_carrito` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_sucursal` INTEGER NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Carrito_id_usuario_id_sucursal_key`(`id_usuario`, `id_sucursal`),
    PRIMARY KEY (`id_carrito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Carrito_Detalle` (
    `id_carrito_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_carrito` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,

    PRIMARY KEY (`id_carrito_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Carrito` ADD CONSTRAINT `Carrito_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Carrito` ADD CONSTRAINT `Carrito_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Carrito_Detalle` ADD CONSTRAINT `Carrito_Detalle_id_carrito_fkey` FOREIGN KEY (`id_carrito`) REFERENCES `Carrito`(`id_carrito`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Carrito_Detalle` ADD CONSTRAINT `Carrito_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;
