-- AlterTable
ALTER TABLE `Producto` MODIFY `precio_detalle` DECIMAL(10, 2) NOT NULL,
    MODIFY `precio_mayoreo` DECIMAL(10, 2) NOT NULL,
    MODIFY `precio_coste` DECIMAL(10, 2) NOT NULL;

-- CreateIndex
CREATE INDEX `Busqueda_Interna_fecha_idx` ON `Busqueda_Interna`(`fecha`);

-- CreateIndex
CREATE INDEX `Busqueda_Interna_termino_idx` ON `Busqueda_Interna`(`termino`);

-- CreateIndex
CREATE INDEX `Pedido_estado_idx` ON `Pedido`(`estado`);

-- CreateIndex
CREATE INDEX `Pedido_fecha_idx` ON `Pedido`(`fecha`);

-- CreateIndex
CREATE INDEX `Pedido_Usuario_tipo_cliente_idx` ON `Pedido_Usuario`(`tipo_cliente`);

-- CreateIndex
CREATE INDEX `Producto_estado_idx` ON `Producto`(`estado`);

-- CreateIndex
CREATE INDEX `Producto_Visitas_fecha_idx` ON `Producto_Visitas`(`fecha`);

-- CreateIndex
CREATE INDEX `Producto_Visitas_id_sesion_idx` ON `Producto_Visitas`(`id_sesion`);

-- RenameIndex
ALTER TABLE `Pedido` RENAME INDEX `Pedido_id_sucursal_fkey` TO `Pedido_id_sucursal_idx`;

-- RenameIndex
ALTER TABLE `Pedido_Usuario` RENAME INDEX `Pedido_Usuario_id_pedido_fkey` TO `Pedido_Usuario_id_pedido_idx`;

-- RenameIndex
ALTER TABLE `Producto` RENAME INDEX `Producto_id_categoria_fkey` TO `Producto_id_categoria_idx`;

-- RenameIndex
ALTER TABLE `Producto` RENAME INDEX `Producto_id_diseno_fkey` TO `Producto_id_diseno_idx`;

-- RenameIndex
ALTER TABLE `Producto` RENAME INDEX `Producto_id_marca_fkey` TO `Producto_id_marca_idx`;

-- RenameIndex
ALTER TABLE `Producto_Visitas` RENAME INDEX `Producto_Visitas_id_producto_fkey` TO `Producto_Visitas_id_producto_idx`;
