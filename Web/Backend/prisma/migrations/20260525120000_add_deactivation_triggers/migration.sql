DROP TRIGGER IF EXISTS trg_marca_after_update;
DROP TRIGGER IF EXISTS trg_diseno_after_update;
DROP TRIGGER IF EXISTS trg_modelo_after_update;

CREATE TRIGGER trg_marca_after_update
AFTER UPDATE ON Marca FOR EACH ROW
BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    UPDATE Producto SET estado = FALSE WHERE id_marca = NEW.id_marca;
    UPDATE Diseno SET activo = FALSE WHERE id_marca = NEW.id_marca;
  END IF;
END;

CREATE TRIGGER trg_diseno_after_update
AFTER UPDATE ON Diseno FOR EACH ROW
BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    UPDATE Producto SET estado = FALSE WHERE id_diseno = NEW.id_diseno;
  END IF;
END;

CREATE TRIGGER trg_modelo_after_update
AFTER UPDATE ON Modelo FOR EACH ROW
BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    DELETE FROM Modelo_Producto WHERE id_modelo = NEW.id_modelo;
  END IF;
END;