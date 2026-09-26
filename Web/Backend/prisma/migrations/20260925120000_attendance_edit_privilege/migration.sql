INSERT INTO `Privilegio` (`nombre`, `descripcion`)
SELECT 'ASI_EDITAR', 'Editar asistencia: permite modificar horas y observaciones de registros de asistencia.'
WHERE NOT EXISTS (
    SELECT 1 FROM `Privilegio` WHERE `nombre` = 'ASI_EDITAR'
);

UPDATE `Privilegio`
SET `descripcion` = 'Permite administrar asistencia dentro de las sucursales asignadas al usuario.'
WHERE `nombre` = 'ASI_ADMINISTRAR';

INSERT IGNORE INTO `Rol_Privilegio` (`id_rol`, `id_privilegio`)
SELECT rp.`id_rol`, report.`id_privilegio`
FROM `Rol_Privilegio` rp
JOIN `Privilegio` mark ON mark.`id_privilegio` = rp.`id_privilegio`
JOIN `Privilegio` report ON report.`nombre` = 'ASI_REPORTES'
WHERE mark.`nombre` = 'ASI_MARCAR';