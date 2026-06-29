/*
  Warnings:

  - A unique constraint covering the columns `[nombre,anio]` on the table `Modelo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Modelo_nombre_anio_key` ON `Modelo`(`nombre`, `anio`);

