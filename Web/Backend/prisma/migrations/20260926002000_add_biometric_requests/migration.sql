CREATE TABLE `Solicitud_Biometria` (
  `id_solicitud` INTEGER NOT NULL AUTO_INCREMENT,
  `id_usuario` INTEGER NOT NULL,
  `embedding_encrypted` TEXT NOT NULL,
  `model_version` VARCHAR(80) NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP(0) NULL,
  `reviewed_by` INTEGER NULL,
  PRIMARY KEY (`id_solicitud`),
  INDEX `Solicitud_Biometria_id_usuario_status_idx` (`id_usuario`, `status`),
  CONSTRAINT `Solicitud_Biometria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`),
  CONSTRAINT `Solicitud_Biometria_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `Usuario` (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;