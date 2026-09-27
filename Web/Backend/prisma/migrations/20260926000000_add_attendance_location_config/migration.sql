ALTER TABLE `Sucursal`
  ADD COLUMN `attendance_radius_m` INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN `max_gps_accuracy_m` INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN `location_configured` BOOLEAN NOT NULL DEFAULT false;