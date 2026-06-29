-- AlterTable
ALTER TABLE `Promocion` ADD COLUMN `mostrar_precio_porcentaje` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mostrar_precio_tachado` BOOLEAN NOT NULL DEFAULT true;
