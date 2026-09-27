ALTER TABLE `Asistencia`
  ADD COLUMN `attendance_method` VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN `gps_latitude` DOUBLE NULL,
  ADD COLUMN `gps_longitude` DOUBLE NULL,
  ADD COLUMN `gps_accuracy_m` DOUBLE NULL,
  ADD COLUMN `distance_from_branch_m` DOUBLE NULL,
  ADD COLUMN `face_verified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `face_similarity` DOUBLE NULL,
  ADD COLUMN `liveness_verified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `verified_at` TIMESTAMP(0) NULL;

CREATE TABLE `Biometria_Facial` (
  `id_biometria` INTEGER NOT NULL AUTO_INCREMENT,
  `id_usuario` INTEGER NOT NULL,
  `embedding` TEXT NOT NULL,
  `model_version` VARCHAR(80) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `registered_by` INTEGER NULL,
  `last_verified_at` TIMESTAMP(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL,
  PRIMARY KEY (`id_biometria`),
  UNIQUE INDEX `Biometria_Facial_id_usuario_key` (`id_usuario`),
  CONSTRAINT `Biometria_Facial_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`),
  CONSTRAINT `Biometria_Facial_registered_by_fkey` FOREIGN KEY (`registered_by`) REFERENCES `Usuario` (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;