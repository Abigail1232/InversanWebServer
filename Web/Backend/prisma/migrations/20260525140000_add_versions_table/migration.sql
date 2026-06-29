-- Step 1: Drop existing FK constraints on Modelo_Producto before touching PRIMARY KEY
ALTER TABLE `Modelo_Producto` DROP FOREIGN KEY `Modelo_Producto_id_modelo_fkey`;
ALTER TABLE `Modelo_Producto` DROP FOREIGN KEY `Modelo_Producto_id_producto_fkey`;

-- Step 2: Now safely drop the compound PRIMARY KEY and add new auto-increment PK + version column
ALTER TABLE `Modelo_Producto`
    DROP PRIMARY KEY,
    ADD COLUMN `id_modelo_producto` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `id_version` INTEGER NULL,
    ADD PRIMARY KEY (`id_modelo_producto`);

-- Step 3: Create the versiones table
CREATE TABLE `versiones` (
    `id_version` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `id_modelo` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 4: Create unique index on Modelo_Producto
CREATE UNIQUE INDEX `Modelo_Producto_id_modelo_id_producto_id_version_key` ON `Modelo_Producto`(`id_modelo`, `id_producto`, `id_version`);

-- Step 5: Re-add the original FK constraints on Modelo_Producto
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo`(`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add FK from versiones to Modelo
ALTER TABLE `versiones` ADD CONSTRAINT `versiones_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo`(`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Add FK from Modelo_Producto.id_version to versiones
ALTER TABLE `Modelo_Producto` ADD CONSTRAINT `Modelo_Producto_id_version_fkey` FOREIGN KEY (`id_version`) REFERENCES `versiones`(`id_version`) ON DELETE SET NULL ON UPDATE CASCADE;

