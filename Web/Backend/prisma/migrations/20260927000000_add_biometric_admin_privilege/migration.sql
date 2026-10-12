INSERT INTO `Privilegio` (`nombre`, `descripcion`)
SELECT
  'ASI_BIOMETRIA_ADMINISTRAR',
  'Registrar, reemplazar, aprobar, rechazar o desactivar biometría facial de empleados.'
WHERE NOT EXISTS (
  SELECT 1
  FROM `Privilegio`
  WHERE `nombre` = 'ASI_BIOMETRIA_ADMINISTRAR'
);
