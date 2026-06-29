-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(30) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `clave` VARCHAR(72) NOT NULL,
    `Primer_nombre` VARCHAR(40) NOT NULL,
    `Segundo_nombre` VARCHAR(40),
    `Primer_apellido` VARCHAR(40) NOT NULL,
    `Segundo_apellido` VARCHAR(40),
    `telefono` VARCHAR(16),
    `activo` BOOLEAN DEFAULT TRUE,
    `id_rol` INTEGER,

    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id_rol` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Privilegio` (
    `id_privilegio` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id_privilegio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol_Privilegio` (
    `id_rol` INTEGER NOT NULL,
    `id_privilegio` INTEGER NOT NULL,

    PRIMARY KEY (`id_rol`, `id_privilegio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sucursal` (
    `id_sucursal` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `RTN` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL,
    `id_municipio` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id_sucursal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Departamento` (
    `id_departamento` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_departamento` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id_departamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Municipio` (
    `id_municipio` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(25) NOT NULL,
    `id_departamento` INTEGER NOT NULL,

    PRIMARY KEY (`id_municipio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Visita_Usuario` (
    `id_visita` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id_visita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `lonas` INTEGER NOT NULL,
    `rin` INTEGER NOT NULL,
    `profundidad` INTEGER NOT NULL,
    `indice_de_carga` DOUBLE NOT NULL,
    `presion_maxima` INTEGER NOT NULL,
    `indice_velocidad` INTEGER NOT NULL,
    `precio_detalle` DOUBLE NOT NULL,
    `precio_mayoreo` DOUBLE NOT NULL,
    `precio_coste` DOUBLE NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `id_marca` INTEGER NOT NULL,
    `id_categoria` INTEGER NOT NULL,

    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Modelo_Producto` (
    `id_modelo` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `anio` DATE NOT NULL,
    `id_producto` INTEGER NOT NULL,

    PRIMARY KEY (`id_modelo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto_Imagen` (
    `id_imagen` INTEGER NOT NULL AUTO_INCREMENT,
    `imagen_url` VARCHAR(255) NOT NULL,
    `orden` INTEGER NOT NULL,
    `imagen_3d` BOOLEAN NOT NULL,
    `id_producto` INTEGER NOT NULL,

    PRIMARY KEY (`id_imagen`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Marca` (
    `id_marca` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `logo_url` VARCHAR(255) NOT NULL,
    `banner_url` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_marca`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `imagen_url` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido` (
    `id_pedido` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_pedido` VARCHAR(50) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `costo_envio` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `IVA` DECIMAL(10, 2) NOT NULL,
    `tipo_de_entrega` ENUM('retiro_en_el_local', 'a_domicilio') NOT NULL,
    `tipo_de_pago` ENUM('efectivo', 'transferencia_bancaria', 'pos', 'compra_click', 'pay_pal') NOT NULL,
    `estado` ENUM('pendiente', 'en_proceso', 'entregado', 'cancelado', 'pago_pendiente', 'devolucion_aplicada', 'devolucion_pendiente') NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL,
    `id_sucursal` INTEGER NOT NULL,
    `id_municipio_entrega` INTEGER NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id_pedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido_Detalle` (
    `id_pedido_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_pedido_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido_Asignacion` (
    `id_pedido_asignacion` INTEGER NOT NULL AUTO_INCREMENT,
    `observacion` VARCHAR(255) NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL,
    `id_pedido` INTEGER NOT NULL,
    `id_repartidor` INTEGER NOT NULL,
    `asignado_por` INTEGER NOT NULL,
    `estado_asignacion` ENUM('asignado', 'no_asignado', 'rechazado') NOT NULL,
    `activo` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_pedido_asignacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Promocion` (
    `id_promocion` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `banner_url` VARCHAR(255) NOT NULL,
    `fecha_inicio` TIMESTAMP(0) NOT NULL,
    `fecha_finalizacion` TIMESTAMP(0) NOT NULL,
    `id_producto` INTEGER NOT NULL,

    PRIMARY KEY (`id_promocion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto_Ingreso` (
    `id_ingreso` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` TIMESTAMP(0) NOT NULL,
    `proveedor` VARCHAR(50) NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_bodega` INTEGER NOT NULL,
    `observaciones` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_ingreso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto_Ingreso_Detalle` (
    `id_ingreso_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_ingreso` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `costo_unitario` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_ingreso_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bodega` (
    `id_bodega` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `id_sucursal` INTEGER NOT NULL,

    PRIMARY KEY (`id_bodega`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock_Bodega` (
    `id_stock_bodega` INTEGER NOT NULL AUTO_INCREMENT,
    `existencias` INTEGER NOT NULL,
    `id_bodega` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `fecha_actualizacion` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id_stock_bodega`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ajuste_Inventario` (
    `id_ajuste` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` TIMESTAMP(0) NOT NULL,
    `cantidad_pre_ajuste` INTEGER NOT NULL,
    `cantidad_post_ajuste` INTEGER NOT NULL,
    `id_stock_bodega` INTEGER NOT NULL,
    `id_usuario` INTEGER NULL,
    `motivo_de_ajuste` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id_ajuste`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sugerencia` (
    `id_sugerencia` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `titulo` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id_sugerencia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Factura` (
    `id_factura` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_factura` VARCHAR(191) NOT NULL,
    `fecha_emision` TIMESTAMP(0) NOT NULL,
    `id_pedido` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_sucursal` INTEGER NOT NULL,
    `id_usuario_emisor` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `iva` DECIMAL(10, 2) NOT NULL,
    `costo_envio` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `tipo_de_pago` ENUM('efectivo', 'transferencia_bancaria', 'pos', 'compra_click', 'mi_pos', 'pay_pal') NOT NULL,
    `estado` ENUM('emitida', 'anulada') NOT NULL,
    `observacion` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Factura_numero_factura_key`(`numero_factura`),
    UNIQUE INDEX `Factura_id_pedido_key`(`id_pedido`),
    PRIMARY KEY (`id_factura`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Factura_Detalle` (
    `id_factura_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_factura` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_factura_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto_Promocion` (
    `id_producto` INTEGER NOT NULL,
    `id_promocion` INTEGER NOT NULL,
    `descuento` DOUBLE NOT NULL,

    PRIMARY KEY (`id_producto`, `id_promocion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacion` (
    `id_notificacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NULL,
    `titulo` VARCHAR(50) NOT NULL,
    `contenido` VARCHAR(300) NOT NULL,
    `fecha_emision` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id_notificacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario_Notificacion` (
    `id_usuario` INTEGER NOT NULL,
    `id_notifiacion` INTEGER NOT NULL,
    `leida` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_usuario`, `id_notifiacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido_Usuario` (
    `id_pedido_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NULL,
    `id_usuario` INTEGER NULL,
    `tipo_cliente` ENUM('registrado', 'invitado') NOT NULL,
    `nombre_cliente` VARCHAR(50) NOT NULL,
    `apellido_cliente` VARCHAR(50) NOT NULL,
    `correo_cliente` VARCHAR(100) NOT NULL,
    `telefono_cliente` VARCHAR(16) NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id_pedido_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rol_Privilegio` ADD CONSTRAINT `Rol_Privilegio_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rol_Privilegio` ADD CONSTRAINT `Rol_Privilegio_id_privilegio_fkey` FOREIGN KEY (`id_privilegio`) REFERENCES `Privilegio`(`id_privilegio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sucursal` ADD CONSTRAINT `Sucursal_id_municipio_fkey` FOREIGN KEY (`id_municipio`) REFERENCES `Municipio`(`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sucursal` ADD CONSTRAINT `Sucursal_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Municipio` ADD CONSTRAINT `Municipio_id_departamento_fkey` FOREIGN KEY (`id_departamento`) REFERENCES `Departamento`(`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_id_marca_fkey` FOREIGN KEY (`id_marca`) REFERENCES `Marca`(`id_marca`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Imagen` ADD CONSTRAINT `Producto_Imagen_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_id_municipio_entrega_fkey` FOREIGN KEY (`id_municipio_entrega`) REFERENCES `Municipio`(`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Detalle` ADD CONSTRAINT `Pedido_Detalle_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido`(`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Detalle` ADD CONSTRAINT `Pedido_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Asignacion` ADD CONSTRAINT `Pedido_Asignacion_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido`(`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Asignacion` ADD CONSTRAINT `Pedido_Asignacion_id_repartidor_fkey` FOREIGN KEY (`id_repartidor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Asignacion` ADD CONSTRAINT `Pedido_Asignacion_asignado_por_fkey` FOREIGN KEY (`asignado_por`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promocion` ADD CONSTRAINT `Promocion_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Ingreso` ADD CONSTRAINT `Producto_Ingreso_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Ingreso` ADD CONSTRAINT `Producto_Ingreso_id_bodega_fkey` FOREIGN KEY (`id_bodega`) REFERENCES `Bodega`(`id_bodega`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Ingreso_Detalle` ADD CONSTRAINT `Producto_Ingreso_Detalle_id_ingreso_fkey` FOREIGN KEY (`id_ingreso`) REFERENCES `Producto_Ingreso`(`id_ingreso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Ingreso_Detalle` ADD CONSTRAINT `Producto_Ingreso_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bodega` ADD CONSTRAINT `Bodega_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock_Bodega` ADD CONSTRAINT `Stock_Bodega_id_bodega_fkey` FOREIGN KEY (`id_bodega`) REFERENCES `Bodega`(`id_bodega`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock_Bodega` ADD CONSTRAINT `Stock_Bodega_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ajuste_Inventario` ADD CONSTRAINT `Ajuste_Inventario_id_stock_bodega_fkey` FOREIGN KEY (`id_stock_bodega`) REFERENCES `Stock_Bodega`(`id_stock_bodega`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ajuste_Inventario` ADD CONSTRAINT `Ajuste_Inventario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sugerencia` ADD CONSTRAINT `sugerencia_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido`(`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_usuario_emisor_fkey` FOREIGN KEY (`id_usuario_emisor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura_Detalle` ADD CONSTRAINT `Factura_Detalle_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `Factura`(`id_factura`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura_Detalle` ADD CONSTRAINT `Factura_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Promocion` ADD CONSTRAINT `Producto_Promocion_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto_Promocion` ADD CONSTRAINT `Producto_Promocion_id_promocion_fkey` FOREIGN KEY (`id_promocion`) REFERENCES `Promocion`(`id_promocion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario_Notificacion` ADD CONSTRAINT `Usuario_Notificacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario_Notificacion` ADD CONSTRAINT `Usuario_Notificacion_id_notifiacion_fkey` FOREIGN KEY (`id_notifiacion`) REFERENCES `Notificacion`(`id_notificacion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Usuario` ADD CONSTRAINT `Pedido_Usuario_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido`(`id_pedido`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido_Usuario` ADD CONSTRAINT `Pedido_Usuario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;
