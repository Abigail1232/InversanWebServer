ALTER TABLE `Sucursal`
  ALTER COLUMN `max_gps_accuracy_m` SET DEFAULT 145;

UPDATE `Sucursal`
SET `max_gps_accuracy_m` = 145
WHERE `max_gps_accuracy_m` = 50;
