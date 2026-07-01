-- CreateTable
CREATE TABLE `Asistencia` (
    `id_asistencia` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_sucursal` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `hora_entrada` VARCHAR(5) NOT NULL,
    `horas_faltadas` INTEGER NOT NULL DEFAULT 0,
    `categoria` VARCHAR(30) NOT NULL,
    `observacion` VARCHAR(255) NULL,
    `registrado_por` INTEGER NULL,
    `actualizado_por` INTEGER NULL,
    `creado_en` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `Asistencia_id_usuario_id_sucursal_fecha_key`(`id_usuario`, `id_sucursal`, `fecha`),
    INDEX `Asistencia_id_sucursal_fecha_idx`(`id_sucursal`, `fecha`),
    INDEX `Asistencia_id_usuario_fecha_idx`(`id_usuario`, `fecha`),
    PRIMARY KEY (`id_asistencia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Asistencia` ADD CONSTRAINT `Asistencia_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asistencia` ADD CONSTRAINT `Asistencia_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal`(`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asistencia` ADD CONSTRAINT `Asistencia_registrado_por_fkey` FOREIGN KEY (`registrado_por`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asistencia` ADD CONSTRAINT `Asistencia_actualizado_por_fkey` FOREIGN KEY (`actualizado_por`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Nuevos privilegios para gestión de asistencias
INSERT INTO `Privilegio` (`nombre`, `descripcion`)
SELECT 'ASI_MARCAR', 'Permite marcar la asistencia de los empleados activos de la sucursal asignada al usuario.'
WHERE NOT EXISTS (SELECT 1 FROM `Privilegio` WHERE `nombre` = 'ASI_MARCAR');

INSERT INTO `Privilegio` (`nombre`, `descripcion`)
SELECT 'ASI_ADMINISTRAR', 'Permite administrar asistencia y seleccionar cualquier sucursal para registrar asistencia.'
WHERE NOT EXISTS (SELECT 1 FROM `Privilegio` WHERE `nombre` = 'ASI_ADMINISTRAR');

INSERT INTO `Privilegio` (`nombre`, `descripcion`)
SELECT 'ASI_REPORTES', 'Permite visualizar reportes de asistencia, horas faltadas y registros semanales por empleado.'
WHERE NOT EXISTS (SELECT 1 FROM `Privilegio` WHERE `nombre` = 'ASI_REPORTES');

-- Rol operativo para usuarios que únicamente marcan asistencia de su sucursal
INSERT INTO `Rol` (`nombre`, `descripcion`, `activo`)
SELECT 'Marcar asistencia', 'Usuario encargado de marcar asistencia de empleados de su sucursal asignada', true
WHERE NOT EXISTS (SELECT 1 FROM `Rol` WHERE `nombre` = 'Marcar asistencia');

-- Asignación de privilegios al nuevo rol
INSERT IGNORE INTO `Rol_Privilegio` (`id_rol`, `id_privilegio`)
SELECT r.`id_rol`, p.`id_privilegio`
FROM `Rol` r
JOIN `Privilegio` p ON p.`nombre` IN ('DASHBOARD_VIEW', 'ASI_MARCAR')
WHERE r.`nombre` = 'Marcar asistencia';

-- El rol Gestor administra asistencia y puede ver reportes
INSERT IGNORE INTO `Rol_Privilegio` (`id_rol`, `id_privilegio`)
SELECT r.`id_rol`, p.`id_privilegio`
FROM `Rol` r
JOIN `Privilegio` p ON p.`nombre` IN ('ASI_MARCAR', 'ASI_ADMINISTRAR', 'ASI_REPORTES')
WHERE r.`nombre` = 'Gestor';
