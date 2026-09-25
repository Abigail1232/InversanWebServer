-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: inversan
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Bodega`
--

DROP TABLE IF EXISTS `Bodega`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Bodega` (
  `id_bodega` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_sucursal` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_bodega`),
  KEY `Bodega_id_sucursal_fkey` (`id_sucursal`),
  CONSTRAINT `Bodega_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Bodega`
--

LOCK TABLES `Bodega` WRITE;
/*!40000 ALTER TABLE `Bodega` DISABLE KEYS */;
INSERT INTO `Bodega` VALUES (1,'Bodega Principal SPS',1,1),(2,'Bodega Secundaria TGU',2,1);
/*!40000 ALTER TABLE `Bodega` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Busqueda_Interna`
--

DROP TABLE IF EXISTS `Busqueda_Interna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Busqueda_Interna` (
  `id_busqueda` int NOT NULL AUTO_INCREMENT,
  `termino` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `id_sesion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuvo_resultado` tinyint(1) NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id_busqueda`),
  KEY `Busqueda_Interna_id_usuario_fkey` (`id_usuario`),
  KEY `Busqueda_Interna_fecha_idx` (`fecha`),
  KEY `Busqueda_Interna_termino_idx` (`termino`),
  CONSTRAINT `Busqueda_Interna_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Busqueda_Interna`
--

LOCK TABLES `Busqueda_Interna` WRITE;
/*!40000 ALTER TABLE `Busqueda_Interna` DISABLE KEYS */;
/*!40000 ALTER TABLE `Busqueda_Interna` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Carrito`
--

DROP TABLE IF EXISTS `Carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Carrito` (
  `id_carrito` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_sucursal` int NOT NULL,
  `fecha_creacion` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id_carrito`),
  UNIQUE KEY `Carrito_id_usuario_id_sucursal_key` (`id_usuario`,`id_sucursal`),
  KEY `Carrito_id_sucursal_fkey` (`id_sucursal`),
  CONSTRAINT `Carrito_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Carrito_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Carrito`
--

LOCK TABLES `Carrito` WRITE;
/*!40000 ALTER TABLE `Carrito` DISABLE KEYS */;
/*!40000 ALTER TABLE `Carrito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Carrito_Detalle`
--

DROP TABLE IF EXISTS `Carrito_Detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Carrito_Detalle` (
  `id_carrito_detalle` int NOT NULL AUTO_INCREMENT,
  `id_carrito` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  PRIMARY KEY (`id_carrito_detalle`),
  KEY `Carrito_Detalle_id_carrito_fkey` (`id_carrito`),
  KEY `Carrito_Detalle_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Carrito_Detalle_id_carrito_fkey` FOREIGN KEY (`id_carrito`) REFERENCES `Carrito` (`id_carrito`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Carrito_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Carrito_Detalle`
--

LOCK TABLES `Carrito_Detalle` WRITE;
/*!40000 ALTER TABLE `Carrito_Detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `Carrito_Detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Categoria`
--

DROP TABLE IF EXISTS `Categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Categoria`
--

LOCK TABLES `Categoria` WRITE;
/*!40000 ALTER TABLE `Categoria` DISABLE KEYS */;
INSERT INTO `Categoria` VALUES (1,'Llanta para turismo','turismo.png',1),(2,'Llanta para camioneta','camioneta.png',1),(3,'Llanta para trabajo pesado','pesado.png',1);
/*!40000 ALTER TABLE `Categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Departamento`
--

DROP TABLE IF EXISTS `Departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Departamento`
--

LOCK TABLES `Departamento` WRITE;
/*!40000 ALTER TABLE `Departamento` DISABLE KEYS */;
INSERT INTO `Departamento` VALUES (1,'Atlántida'),(2,'Choluteca'),(3,'Colón'),(4,'Comayagua'),(5,'Copán'),(6,'Cortés'),(7,'El Paraíso'),(8,'Francisco Morazán'),(9,'Gracias a Dios'),(10,'Intibucá'),(11,'Islas de la Bahía'),(12,'La Paz'),(13,'Lempira'),(14,'Ocotepeque'),(15,'Olancho'),(16,'Santa Bárbara'),(17,'Valle'),(18,'Yoro');
/*!40000 ALTER TABLE `Departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Devolucion`
--

DROP TABLE IF EXISTS `Devolucion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Devolucion` (
  `id_devolucion` int NOT NULL AUTO_INCREMENT,
  `numero_devolucion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('parcial','total') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('solicitada','aprobada','rechazada','procesada') COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto_subtotal` decimal(10,2) NOT NULL,
  `monto_iva` decimal(10,2) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `id_factura` int NOT NULL,
  `id_usuario_registra` int NOT NULL,
  `id_usuario_aprueba` int DEFAULT NULL,
  PRIMARY KEY (`id_devolucion`),
  UNIQUE KEY `Devolucion_numero_devolucion_key` (`numero_devolucion`),
  KEY `Devolucion_id_factura_fkey` (`id_factura`),
  KEY `Devolucion_id_usuario_registra_fkey` (`id_usuario_registra`),
  KEY `Devolucion_id_usuario_aprueba_fkey` (`id_usuario_aprueba`),
  CONSTRAINT `Devolucion_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `Factura` (`id_factura`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Devolucion_id_usuario_aprueba_fkey` FOREIGN KEY (`id_usuario_aprueba`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Devolucion_id_usuario_registra_fkey` FOREIGN KEY (`id_usuario_registra`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Devolucion`
--

LOCK TABLES `Devolucion` WRITE;
/*!40000 ALTER TABLE `Devolucion` DISABLE KEYS */;
/*!40000 ALTER TABLE `Devolucion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Devolucion_Detalle`
--

DROP TABLE IF EXISTS `Devolucion_Detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Devolucion_Detalle` (
  `id_devolucion_detalle` int NOT NULL AUTO_INCREMENT,
  `id_devolucion` int NOT NULL,
  `id_factura_detalle` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_devolucion_detalle`),
  KEY `Devolucion_Detalle_id_devolucion_fkey` (`id_devolucion`),
  KEY `Devolucion_Detalle_id_factura_detalle_fkey` (`id_factura_detalle`),
  CONSTRAINT `Devolucion_Detalle_id_devolucion_fkey` FOREIGN KEY (`id_devolucion`) REFERENCES `Devolucion` (`id_devolucion`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Devolucion_Detalle_id_factura_detalle_fkey` FOREIGN KEY (`id_factura_detalle`) REFERENCES `Factura_Detalle` (`id_factura_detalle`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Devolucion_Detalle`
--

LOCK TABLES `Devolucion_Detalle` WRITE;
/*!40000 ALTER TABLE `Devolucion_Detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `Devolucion_Detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Diseno`
--

DROP TABLE IF EXISTS `Diseno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Diseno` (
  `id_diseno` int NOT NULL AUTO_INCREMENT,
  `id_marca` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` datetime(3) NOT NULL,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_diseno`),
  KEY `Diseno_id_marca_fkey` (`id_marca`),
  CONSTRAINT `Diseno_id_marca_fkey` FOREIGN KEY (`id_marca`) REFERENCES `Marca` (`id_marca`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Diseno`
--

LOCK TABLES `Diseno` WRITE;
/*!40000 ALTER TABLE `Diseno` DISABLE KEYS */;
INSERT INTO `Diseno` VALUES (1,1,'Direccional','Patrón en forma de V que mejora el drenaje de agua y el agarre en lluvia','2026-06-30 18:47:15.571','2026-06-30 18:47:15.571','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1),(2,2,'Simétrico','Patrón uniforme en toda la banda de rodadura, mayor durabilidad y bajo ruido','2026-06-30 18:47:15.578','2026-06-30 18:47:15.578','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1),(3,3,'Asimétrico','Diferente diseño en interior y exterior para balancear agarre y confort','2026-06-30 18:47:15.583','2026-06-30 18:47:15.583','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1),(4,4,'All Terrain','Patrón agresivo para uso mixto en carretera y terrenos irregulares','2026-06-30 18:47:15.588','2026-06-30 18:47:15.588','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1),(5,2,'Mud Terrain','Diseño con tacos profundos para máximo agarre en lodo','2026-06-30 18:47:15.593','2026-06-30 18:47:15.593','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1),(6,1,'High Performance','Patrón optimizado para alta velocidad y máximo agarre en seco','2026-06-30 18:47:15.601','2026-06-30 18:47:15.601','https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png',1);
/*!40000 ALTER TABLE `Diseno` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `trg_diseno_after_update` AFTER UPDATE ON `Diseno` FOR EACH ROW BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    UPDATE Producto SET estado = FALSE WHERE id_diseno = NEW.id_diseno;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Empleado_Sucursal`
--

DROP TABLE IF EXISTS `Empleado_Sucursal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Empleado_Sucursal` (
  `id_empleado_sucursal` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_sucursal` int NOT NULL,
  PRIMARY KEY (`id_empleado_sucursal`),
  UNIQUE KEY `Empleado_Sucursal_id_usuario_id_sucursal_key` (`id_usuario`,`id_sucursal`),
  KEY `Empleado_Sucursal_id_sucursal_fkey` (`id_sucursal`),
  CONSTRAINT `Empleado_Sucursal_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Empleado_Sucursal_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Empleado_Sucursal`
--

LOCK TABLES `Empleado_Sucursal` WRITE;
/*!40000 ALTER TABLE `Empleado_Sucursal` DISABLE KEYS */;
INSERT INTO `Empleado_Sucursal` VALUES (3,1,1),(4,1,2),(5,2,2),(1,3,1),(2,4,1);
/*!40000 ALTER TABLE `Empleado_Sucursal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Factura`
--

DROP TABLE IF EXISTS `Factura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Factura` (
  `id_factura` int NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_emision` timestamp NOT NULL,
  `id_pedido` int NOT NULL,
  `id_usuario_emisor` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `iva` decimal(10,2) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `tipo_de_pago` enum('efectivo','transferencia_bancaria','pos','compra_click','mi_pos','pay_pal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('emitida','anulada') COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_pedido_usuario` int NOT NULL,
  PRIMARY KEY (`id_factura`),
  UNIQUE KEY `Factura_numero_factura_key` (`numero_factura`),
  UNIQUE KEY `Factura_id_pedido_key` (`id_pedido`),
  KEY `Factura_id_usuario_emisor_fkey` (`id_usuario_emisor`),
  KEY `Factura_id_pedido_usuario_fkey` (`id_pedido_usuario`),
  CONSTRAINT `Factura_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido` (`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Factura_id_pedido_usuario_fkey` FOREIGN KEY (`id_pedido_usuario`) REFERENCES `Pedido_Usuario` (`id_pedido_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Factura_id_usuario_emisor_fkey` FOREIGN KEY (`id_usuario_emisor`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Factura`
--

LOCK TABLES `Factura` WRITE;
/*!40000 ALTER TABLE `Factura` DISABLE KEYS */;
/*!40000 ALTER TABLE `Factura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Factura_Detalle`
--

DROP TABLE IF EXISTS `Factura_Detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Factura_Detalle` (
  `id_factura_detalle` int NOT NULL AUTO_INCREMENT,
  `id_factura` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_factura_detalle`),
  KEY `Factura_Detalle_id_factura_fkey` (`id_factura`),
  KEY `Factura_Detalle_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Factura_Detalle_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `Factura` (`id_factura`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Factura_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Factura_Detalle`
--

LOCK TABLES `Factura_Detalle` WRITE;
/*!40000 ALTER TABLE `Factura_Detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `Factura_Detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Marca`
--

DROP TABLE IF EXISTS `Marca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Marca` (
  `id_marca` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `banner_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_marca`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Marca`
--

LOCK TABLES `Marca` WRITE;
/*!40000 ALTER TABLE `Marca` DISABLE KEYS */;
INSERT INTO `Marca` VALUES (1,'Michelin','Michelin_Logo_2017.svg','michelin-tire-race-car-banner.jpg',1),(2,'Bridgestone','bridgeston.png','Bstone_Banner.jpg',1),(3,'Goodyear','gooyear.png','goody.png',1),(4,'Continental','continental.png','continentalbanner.jpg',1);
/*!40000 ALTER TABLE `Marca` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `trg_marca_after_update` AFTER UPDATE ON `Marca` FOR EACH ROW BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    UPDATE Producto SET estado = FALSE WHERE id_marca = NEW.id_marca;
    UPDATE Diseno SET activo = FALSE WHERE id_marca = NEW.id_marca;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Modelo`
--

DROP TABLE IF EXISTS `Modelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Modelo` (
  `id_modelo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio` date NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `marca` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_modelo`),
  UNIQUE KEY `Modelo_nombre_anio_key` (`nombre`,`anio`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Modelo`
--

LOCK TABLES `Modelo` WRITE;
/*!40000 ALTER TABLE `Modelo` DISABLE KEYS */;
INSERT INTO `Modelo` VALUES (1,'Corolla','2022-01-01',1,'Toyota'),(2,'Hilux','2023-01-01',1,'Toyota'),(3,'RAV4','2023-01-01',1,'Toyota'),(4,'Yaris','2023-01-01',1,'Toyota'),(5,'Ranger','2024-01-01',1,'Ford'),(6,'Fiesta','2020-01-01',1,'Ford'),(7,'Focus','2022-01-01',1,'Ford'),(8,'Escape','2023-01-01',1,'Ford'),(9,'Explorer','2024-01-01',1,'Ford'),(10,'F-150','2024-01-01',1,'Ford'),(11,'Civic','2021-01-01',1,'Honda'),(12,'CR-V','2023-01-01',1,'Honda'),(13,'Pilot','2024-01-01',1,'Honda'),(14,'Sentra','2022-01-01',1,'Nissan'),(15,'Kicks','2023-01-01',1,'Nissan'),(16,'Versa','2021-01-01',1,'Nissan'),(17,'Pathfinder','2024-01-01',1,'Nissan'),(18,'Altima','2023-01-01',1,'Nissan'),(19,'Frontier','2023-01-01',1,'Nissan'),(20,'Sportage','2023-01-01',1,'Kia'),(21,'Silverado','2024-01-01',1,'Chevrolet');
/*!40000 ALTER TABLE `Modelo` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `trg_modelo_after_update` AFTER UPDATE ON `Modelo` FOR EACH ROW BEGIN
  IF OLD.activo = TRUE AND NEW.activo = FALSE THEN
    DELETE FROM Modelo_Producto WHERE id_modelo = NEW.id_modelo;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Modelo_Producto`
--

DROP TABLE IF EXISTS `Modelo_Producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Modelo_Producto` (
  `id_modelo` int NOT NULL,
  `id_producto` int NOT NULL,
  `id_modelo_producto` int NOT NULL AUTO_INCREMENT,
  `id_version` int DEFAULT NULL,
  PRIMARY KEY (`id_modelo_producto`),
  UNIQUE KEY `Modelo_Producto_id_modelo_id_producto_id_version_key` (`id_modelo`,`id_producto`,`id_version`),
  KEY `Modelo_Producto_id_producto_fkey` (`id_producto`),
  KEY `Modelo_Producto_id_version_fkey` (`id_version`),
  CONSTRAINT `Modelo_Producto_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo` (`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Modelo_Producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Modelo_Producto_id_version_fkey` FOREIGN KEY (`id_version`) REFERENCES `versiones` (`id_version`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Modelo_Producto`
--

LOCK TABLES `Modelo_Producto` WRITE;
/*!40000 ALTER TABLE `Modelo_Producto` DISABLE KEYS */;
INSERT INTO `Modelo_Producto` VALUES (1,1,1,NULL),(2,2,3,NULL),(2,3,4,NULL),(4,5,5,NULL),(9,1,2,NULL);
/*!40000 ALTER TABLE `Modelo_Producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Municipio`
--

DROP TABLE IF EXISTS `Municipio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Municipio` (
  `id_municipio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_departamento` int NOT NULL,
  PRIMARY KEY (`id_municipio`),
  KEY `Municipio_id_departamento_fkey` (`id_departamento`),
  CONSTRAINT `Municipio_id_departamento_fkey` FOREIGN KEY (`id_departamento`) REFERENCES `Departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=299 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Municipio`
--

LOCK TABLES `Municipio` WRITE;
/*!40000 ALTER TABLE `Municipio` DISABLE KEYS */;
INSERT INTO `Municipio` VALUES (1,'La Ceiba',1),(2,'El Porvenir',1),(3,'Tela',1),(4,'Jutiapa',1),(5,'La Masica',1),(6,'San Francisco',1),(7,'Arizona',1),(8,'Esparta',1),(9,'Choluteca',2),(10,'Apacilagua',2),(11,'Concepción de María',2),(12,'Duyure',2),(13,'El Corpus',2),(14,'El Triunfo',2),(15,'Marcovia',2),(16,'Morolica',2),(17,'Namasigüe',2),(18,'Orocuina',2),(19,'Pespire',2),(20,'San Antonio de Flores',2),(21,'San Isidro',2),(22,'San José',2),(23,'San Marcos de Colón',2),(24,'Santa Ana de Yusguare',2),(25,'Trujillo',3),(26,'Balfate',3),(27,'Iriona',3),(28,'Limón',3),(29,'Sabá',3),(30,'Santa Fe',3),(31,'Santa Rosa de Aguán',3),(32,'Sonaguera',3),(33,'Tocoa',3),(34,'Bonito Oriental',3),(35,'Comayagua',4),(36,'Ajuterique',4),(37,'El Rosario',4),(38,'Esquías',4),(39,'Humuya',4),(40,'La Libertad',4),(41,'Lamaní',4),(42,'La Trinidad',4),(43,'Lejamaní',4),(44,'Meámbar',4),(45,'Minas de Oro',4),(46,'Ojos de Agua',4),(47,'San Jerónimo',4),(48,'San José de Comayagua',4),(49,'San José del Potrero',4),(50,'San Luis',4),(51,'San Sebastián',4),(52,'Siguatepeque',4),(53,'Villa de San Antonio',4),(54,'Las Lajas',4),(55,'Taulabé',4),(56,'Santa Rosa de Copán',5),(57,'Cabañas',5),(58,'Concepción',5),(59,'Copan Ruinas',5),(60,'Corquín',5),(61,'Cucuyagua',5),(62,'Dolores',5),(63,'Dulce Nombre',5),(64,'El Paraíso',5),(65,'Florida',5),(66,'La Jigua',5),(67,'La Unión',5),(68,'Nueva Arcadia',5),(69,'San Agustín',5),(70,'San Antonio',5),(71,'San Jerónimo',5),(72,'San José',5),(73,'San Juan de Opoa',5),(74,'San Nicolás',5),(75,'San Pedro',5),(76,'Santa rita',5),(77,'Trinidad de Copán',5),(78,'Veracruz',5),(79,'San Pedro Sula',6),(80,'Choloma',6),(81,'Omoa',6),(82,'Pimienta',6),(83,'Potrerillos',6),(84,'Puerto Cortés',6),(85,'San Antonio de Cortés',6),(86,'San Francisco de Yojoa',6),(87,'San Manuel',6),(88,'Santa Cruz de Yojoa',6),(89,'Villanueva',6),(90,'La Lima',6),(91,'Yuscarán',7),(92,'Alauca',7),(93,'Danlí',7),(94,'El Paraíso',7),(95,'Güinope',7),(96,'Jacaleapa',7),(97,'Liure',7),(98,'Morocelí',7),(99,'Oropolí',7),(100,'Potrerillos',7),(101,'San Antonio de Flores',7),(102,'San Lucas',7),(103,'San Matías',7),(104,'Soledad',7),(105,'Teupasenti',7),(106,'Texiguat',7),(107,'Vado Ancho',7),(108,'Yauyupe',7),(109,'Trojes',7),(110,'Tegucigalpa',8),(111,'Alubarén',8),(112,'Cedros',8),(113,'Curarén',8),(114,'El Porvenir',8),(115,'Guaimaca',8),(116,'La Libertad',8),(117,'La Venta',8),(118,'Lepaterique',8),(119,'Maraita',8),(120,'Marale',8),(121,'Nueva Armenia',8),(122,'Ojojona',8),(123,'Orica',8),(124,'Reitoca',8),(125,'Sabanagrande',8),(126,'San Antonio de Oriente',8),(127,'San Buenaventura',8),(128,'San Ignacio',8),(129,'Cantarranas',8),(130,'San Miguelito',8),(131,'Santa Ana',8),(132,'Santa Lucía',8),(133,'Talanga',8),(134,'Tatumbla',8),(135,'Valle de Ángeles',8),(136,'Villa de San Francisco',8),(137,'Vallecillo',8),(138,'Puerto Lempira',9),(139,'Brus Laguna',9),(140,'Ahuas',9),(141,'Juan Francisco Bulnes',9),(142,'Villeda Morales',9),(143,'Wampusirpe',9),(144,'La Esperanza',10),(145,'Camasca',10),(146,'Colomoncagua',10),(147,'Concepción',10),(148,'Dolores',10),(149,'Intibucá',10),(150,'Jesús de Otoro',10),(151,'Magdalena',10),(152,'Masaguara',10),(153,'San Antonio',10),(154,'San Isidro',10),(155,'San Juan',10),(156,'San Marcos de la Sierra',10),(157,'San Miguel Guancapla',10),(158,'Santa Lucía',10),(159,'Yamaranguila',10),(160,'San Francisco de Opalaca',10),(161,'Roatán',11),(162,'Guanaja',11),(163,'José Santos Guardiola',11),(164,'Utila',11),(165,'La Paz',12),(166,'Aguanqueterique',12),(167,'Cabañas',12),(168,'Cane',12),(169,'Chinacla',12),(170,'Guajiquiro',12),(171,'Lauterique',12),(172,'Marcala',12),(173,'Mercedes de Oriente',12),(174,'Opatoro',12),(175,'San Antonio del Norte',12),(176,'San José',12),(177,'San Juan',12),(178,'San Pedro de Tutule',12),(179,'Santa Ana',12),(180,'Santa Elena',12),(181,'Santa María',12),(182,'Santiago de Puringla',12),(183,'Yarula',12),(184,'Gracias',13),(185,'Belén',13),(186,'Candelaria',13),(187,'Cololaca',13),(188,'Erandique',13),(189,'Gualcince',13),(190,'Guarita',13),(191,'La Campa',13),(192,'La Iguala',13),(193,'Las Flores',13),(194,'La Unión',13),(195,'La Virtud',13),(196,'Lepaera',13),(197,'Mapulaca',13),(198,'Piraera',13),(199,'San Andrés',13),(200,'San Francisco',13),(201,'San Juan Guarita',13),(202,'San Manuel Colohete',13),(203,'San Rafael',13),(204,'San Sebastián',13),(205,'Santa Cruz',13),(206,'Talgua',13),(207,'Tambla',13),(208,'Tomalá',13),(209,'Valladolid',13),(210,'Virginia',13),(211,'San Marcos de Caiquín',13),(212,'Ocotepeque',14),(213,'Belén Gualcho',14),(214,'Concepción',14),(215,'Dolores Merendón',14),(216,'Fraternidad',14),(217,'La Encarnación',14),(218,'La Labor',14),(219,'Lucerna',14),(220,'Mercedes',14),(221,'San Fernando',14),(222,'San Francisco del Valle',14),(223,'San Jorge',14),(224,'San Marcos',14),(225,'Santa Fe',14),(226,'Sensenti',14),(227,'Sinuapa',14),(228,'Juticalpa',15),(229,'Campamento',15),(230,'Catacamas',15),(231,'Concordia',15),(232,'Dulce Nombre de Culmí',15),(233,'El Rosario',15),(234,'Esquipulas del Norte',15),(235,'Gualaco',15),(236,'Guarizama',15),(237,'Guata',15),(238,'Guayape',15),(239,'Jano',15),(240,'La Unión',15),(241,'Mangulile',15),(242,'Manto',15),(243,'Salamá',15),(244,'San Esteban',15),(245,'San Francisco de Becerra',15),(246,'San Francisco de la Paz',15),(247,'Santa María del Real',15),(248,'Silca',15),(249,'Yocón',15),(250,'Patuca',15),(251,'Santa Bárbara',16),(252,'Arada',16),(253,'Atima',16),(254,'Azacualpa',16),(255,'Ceguaca',16),(256,'Concepción del Norte',16),(257,'Concepción del Sur',16),(258,'Chinda',16),(259,'El Níspero',16),(260,'Gualala',16),(261,'Ilama',16),(262,'Las Vegas',16),(263,'Macuelizo',16),(264,'Naranjito',16),(265,'Nuevo Celilac',16),(266,'Nueva Frontera',16),(267,'Petoa',16),(268,'Protección',16),(269,'Quimistán',16),(270,'San Francisco de Ojuera',16),(271,'San José de las Colinas',16),(272,'San Luis',16),(273,'San Marcos',16),(274,'San Nicolás',16),(275,'San Pedro Zacapa',16),(276,'San Vicente Centenario',16),(277,'Santa Rita',16),(278,'Trinidad',16),(279,'Nacaome',17),(280,'Alianza',17),(281,'Amapala',17),(282,'Aramecina',17),(283,'Caridad',17),(284,'Goascorán',17),(285,'Langue',17),(286,'San Francisco de Coray',17),(287,'San Lorenzo',17),(288,'Yoro',18),(289,'Arenal',18),(290,'El Negrito',18),(291,'El Progreso',18),(292,'Jocón',18),(293,'Morazán',18),(294,'Olanchito',18),(295,'Santa Rita',18),(296,'Sulaco',18),(297,'Victoria',18),(298,'Yorito',18);
/*!40000 ALTER TABLE `Municipio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notificacion`
--

DROP TABLE IF EXISTS `Notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notificacion` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `titulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_emision` timestamp NOT NULL,
  `ruta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `Notificacion_id_usuario_fkey` (`id_usuario`),
  CONSTRAINT `Notificacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notificacion`
--

LOCK TABLES `Notificacion` WRITE;
/*!40000 ALTER TABLE `Notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `Notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pedido`
--

DROP TABLE IF EXISTS `Pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pedido` (
  `id_pedido` int NOT NULL AUTO_INCREMENT,
  `numero_pedido` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `IVA` decimal(10,2) NOT NULL,
  `tipo_de_entrega` enum('retiro_en_el_local','a_domicilio') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_de_pago` enum('efectivo','transferencia_bancaria','pos','compra_click','pay_pal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','en_proceso','entregado','cancelado','pago_pendiente','devolucion_aplicada','devolucion_pendiente') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL,
  `id_sucursal` int NOT NULL,
  `id_municipio_entrega` int NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comprobante_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `Pedido_id_sucursal_idx` (`id_sucursal`),
  KEY `Pedido_id_municipio_entrega_fkey` (`id_municipio_entrega`),
  KEY `Pedido_estado_idx` (`estado`),
  KEY `Pedido_fecha_idx` (`fecha`),
  CONSTRAINT `Pedido_id_municipio_entrega_fkey` FOREIGN KEY (`id_municipio_entrega`) REFERENCES `Municipio` (`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Pedido_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pedido`
--

LOCK TABLES `Pedido` WRITE;
/*!40000 ALTER TABLE `Pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `Pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pedido_Asignacion`
--

DROP TABLE IF EXISTS `Pedido_Asignacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pedido_Asignacion` (
  `id_pedido_asignacion` int NOT NULL AUTO_INCREMENT,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_asignacion` timestamp NOT NULL,
  `id_pedido` int NOT NULL,
  `id_repartidor` int DEFAULT NULL,
  `asignado_por` int DEFAULT NULL,
  `estado_asignacion` enum('asignado','no_asignado','rechazado') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `fecha_estimada_entrega` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_pedido_asignacion`),
  KEY `Pedido_Asignacion_id_pedido_fkey` (`id_pedido`),
  KEY `Pedido_Asignacion_id_repartidor_fkey` (`id_repartidor`),
  KEY `Pedido_Asignacion_asignado_por_fkey` (`asignado_por`),
  CONSTRAINT `Pedido_Asignacion_asignado_por_fkey` FOREIGN KEY (`asignado_por`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Pedido_Asignacion_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido` (`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Pedido_Asignacion_id_repartidor_fkey` FOREIGN KEY (`id_repartidor`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pedido_Asignacion`
--

LOCK TABLES `Pedido_Asignacion` WRITE;
/*!40000 ALTER TABLE `Pedido_Asignacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `Pedido_Asignacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pedido_Detalle`
--

DROP TABLE IF EXISTS `Pedido_Detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pedido_Detalle` (
  `id_pedido_detalle` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_pedido_detalle`),
  KEY `Pedido_Detalle_id_pedido_fkey` (`id_pedido`),
  KEY `Pedido_Detalle_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Pedido_Detalle_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido` (`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Pedido_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pedido_Detalle`
--

LOCK TABLES `Pedido_Detalle` WRITE;
/*!40000 ALTER TABLE `Pedido_Detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `Pedido_Detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pedido_Usuario`
--

DROP TABLE IF EXISTS `Pedido_Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pedido_Usuario` (
  `id_pedido_usuario` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `tipo_cliente` enum('registrado','invitado') COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo_cliente` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono_cliente` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL,
  `nombre_completo` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_pedido_usuario`),
  KEY `Pedido_Usuario_id_usuario_fkey` (`id_usuario`),
  KEY `Pedido_Usuario_id_pedido_idx` (`id_pedido`),
  KEY `Pedido_Usuario_tipo_cliente_idx` (`tipo_cliente`),
  CONSTRAINT `Pedido_Usuario_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `Pedido` (`id_pedido`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Pedido_Usuario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pedido_Usuario`
--

LOCK TABLES `Pedido_Usuario` WRITE;
/*!40000 ALTER TABLE `Pedido_Usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `Pedido_Usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Privilegio`
--

DROP TABLE IF EXISTS `Privilegio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Privilegio` (
  `id_privilegio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_privilegio`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Privilegio`
--

LOCK TABLES `Privilegio` WRITE;
/*!40000 ALTER TABLE `Privilegio` DISABLE KEYS */;
INSERT INTO `Privilegio` VALUES (1,'REP_VENTAS','Visualizar reportes detallados de ventas y estadísticas financieras generales.'),(2,'REP_VISITAS','Acceso a las métricas de tráfico del sitio, permitiendo ver qué productos son más visitados y el comportamiento de los usuarios en la plataforma.'),(3,'REP_SUGERENCIAS','Acceso para leer y gestionar las sugerencias y comentarios enviados por los clientes a través del buzón de contacto.'),(4,'ADM_USUARIOS','Gestión total de cuentas de usuario: creación, edición de datos, activación/desactivación y asignación de roles de sistema.'),(5,'ADM_SUCURSALES','Configuración de los datos de la empresa, sucursales y sus respectivas bodegas locales.'),(6,'INV_INGRESO','Capacidad para registrar entradas de nueva mercancía al sistema, actualizando automáticamente el stock disponible por sucursal.'),(7,'IS_MAYORIST','Etiqueta de cliente mayorista. Al activarse, habilita el banner de precios especiales y descuentos por volumen en el catálogo.'),(8,'ALL_ACCESS','Superusuario con permisos totales. Tiene acceso ilimitado a todas las funciones administrativas y operativas sin restricciones.'),(9,'INV_HISTORIAL','Acceso a la bitácora histórica de ingresos de inventario para auditoría y control de entradas pasadas.'),(10,'PED_PEDIDOS','Gestión central de órdenes: ver lista general de pedidos, cambiar estados (validar, cancelar) y asignar transportistas.'),(11,'PED_ENTREGA','Interfaz para repartidores: permite ver las rutas asignadas, marcar pedidos como entregados y administrar entregas activas.'),(12,'PED_HISTORIAL','Acceso al historial completo de entregas y pedidos finalizados de todos los usuarios.'),(13,'ADM_MODELOS','Gestión del catálogo de modelos asociados a los productos (especificaciones técnicas y variantes).'),(14,'ADM_PRODUCTOS','Control total del catálogo de productos: subir nuevas unidades, editar fotos, nombres, precios y stock inicial.'),(15,'ADM_MARCAS','Administración de las marcas comerciales que representan a los productos en la tienda virtual.'),(16,'ADM_PROMOCIONES','Creación y gestión de descuentos temporales, ofertas especiales y configuración de banners promocionales.'),(17,'ADM_CATEGORIAS','Organización del catálogo mediante la creación y edición de categorías y subcategorías de productos.'),(18,'ADM_ROLES','Gestión de la estructura jerárquica: crear nuevos perfiles (ej. Vendedor, Gestor) y administrar sus nombres.'),(19,'ADM_DISENOS','Gestión de los diseños de rines y variantes visuales que se muestran en la galería de productos.'),(20,'DASHBOARD_VIEW','Acceso al panel principal de estadísticas: resumen de ventas, stock crítico y alertas operativas del día.'),(21,'SOLO_CLIENTES','Permiso de navegación: permite al usuario buscar productos y ver el carrito. Habilita la barra de búsqueda y oculta el panel administrativo.'),(22,'ADM_PERMISOS','Control granular de seguridad: asignar y remover privilegios específicos a cada rol definido en el sistema.');
/*!40000 ALTER TABLE `Privilegio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto`
--

DROP TABLE IF EXISTS `Producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lonas` decimal(6,2) NOT NULL,
  `rin` decimal(6,2) NOT NULL,
  `profundidad` decimal(65,30) NOT NULL,
  `indice_de_carga` double NOT NULL,
  `presion_maxima` int NOT NULL,
  `indice_velocidad` int NOT NULL,
  `precio_detalle` decimal(10,2) NOT NULL,
  `precio_mayoreo` decimal(10,2) NOT NULL,
  `precio_coste` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_marca` int NOT NULL,
  `id_categoria` int NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `alto_rin` decimal(6,2) NOT NULL,
  `ancho_rin` decimal(6,2) NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen_3d` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_diseno` int NOT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `Producto_id_marca_idx` (`id_marca`),
  KEY `Producto_id_categoria_idx` (`id_categoria`),
  KEY `Producto_id_diseno_idx` (`id_diseno`),
  KEY `Producto_estado_idx` (`estado`),
  CONSTRAINT `Producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `Categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_id_diseno_fkey` FOREIGN KEY (`id_diseno`) REFERENCES `Diseno` (`id_diseno`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_id_marca_fkey` FOREIGN KEY (`id_marca`) REFERENCES `Marca` (`id_marca`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto`
--

LOCK TABLES `Producto` WRITE;
/*!40000 ALTER TABLE `Producto` DISABLE KEYS */;
INSERT INTO `Producto` VALUES (1,'Llanta Michelin 205/55R16',4.00,16.00,8.000000000000000000000000000000,91,44,210,2500.00,2300.00,1800.00,'Llanta radial para turismo de alto rendimiento',1,1,1,55.00,205.00,'Primacy 4','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(2,'Llanta Bridgestone 215/60R16',4.00,16.00,9.000000000000000000000000000000,95,46,220,2800.00,2550.00,2000.00,'Llanta confiable para uso diario y carretera',2,1,1,60.00,215.00,'Turanza T005','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(3,'Llanta Goodyear 265/65R17',6.00,17.00,10.000000000000000000000000000000,112,50,180,4200.00,3900.00,3200.00,'Llanta para camioneta con excelente tracción',3,2,1,75.00,245.00,'Wrangler All Terrain Adventure','/Modelo3d/camaro_copo_tyre/scene.gltf',4),(4,'Llanta Michelin 195/65R15',4.00,15.00,8.000000000000000000000000000000,89,42,190,2000.00,1850.00,1500.00,'Llanta económica para vehículo sedán',1,1,1,75.00,245.00,'Energy XM2+','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(5,'Llanta Bridgestone 245/75R16',6.00,16.00,11.000000000000000000000000000000,109,52,170,1500.00,1400.00,1100.00,'Llanta resistente para carga y trabajo',2,3,1,75.00,245.00,'Dueler A/T 697','/Modelo3d/camaro_copo_tyre/scene.gltf',4),(6,'Llanta Goodyear 225/60R17',4.00,17.00,9.000000000000000000000000000000,99,44,200,3100.00,2900.00,2200.00,'Llanta todo tiempo para SUV mediano',3,2,1,60.00,225.00,'Assurance WeatherReady','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(7,'Llanta Michelin 235/55R18',6.00,18.00,10.000000000000000000000000000000,99,50,210,4800.00,4500.00,3500.00,'Alto rendimiento y confort para SUV',1,2,1,55.00,235.00,'Pilot Sport 4 SUV','/Modelo3d/camaro_copo_tyre/scene.gltf',6),(8,'Llanta Bridgestone 205/55R16',4.00,16.00,8.000000000000000000000000000000,91,44,210,2600.00,2400.00,1900.00,'Alternativa económica para turismo',2,1,1,55.00,205.00,'Ecopia EP300','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(9,'Llanta Goodyear 195/65R15',4.00,15.00,8.000000000000000000000000000000,91,44,210,1850.00,1700.00,1400.00,'Ideal para compactos y sedanes',3,1,1,65.00,195.00,'EfficientGrip Performance','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(10,'Llanta Michelin 265/70R17',6.00,17.00,11.000000000000000000000000000000,112,50,180,5500.00,5100.00,4000.00,'Llanta todo terreno para pickup y 4x4',1,2,1,70.00,265.00,'LTX A/T2','/Modelo3d/camaro_copo_tyre/scene.gltf',4),(11,'Llanta Continental 185/65R14',4.00,14.00,8.000000000000000000000000000000,86,44,190,1650.00,1520.00,1200.00,'Llanta económica para autos compactos',4,1,1,65.00,185.00,'ContiEcoContact 5','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(12,'Llanta Continental 205/55R16',4.00,16.00,9.000000000000000000000000000000,91,44,210,2700.00,2500.00,1950.00,'Turismo confort y bajo ruido',4,1,1,55.00,205.00,'ContiPremiumContact 6','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(13,'Llanta Continental 235/60R17',6.00,17.00,10.000000000000000000000000000000,102,50,200,3900.00,3600.00,2800.00,'SUV y crossover todo tiempo',4,2,1,60.00,235.00,'CrossContact LX2','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(14,'Llanta Continental 255/55R19',6.00,19.00,10.000000000000000000000000000000,105,50,210,6200.00,5800.00,4500.00,'Premium SUV y pickup',4,2,1,55.00,255.00,'PremiumContact 6','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(15,'Llanta Michelin 225/50R17',4.00,17.00,9.000000000000000000000000000000,94,44,210,3200.00,2980.00,2400.00,'Turismo deportivo',1,1,1,50.00,225.00,'Pilot Sport 4','/Modelo3d/camaro_copo_tyre/scene.gltf',6),(16,'Llanta Bridgestone 235/65R17',6.00,17.00,10.000000000000000000000000000000,104,50,200,4100.00,3800.00,3000.00,'SUV familiar todo tiempo',2,2,1,65.00,235.00,'Dueler H/L 400','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(17,'Llanta Goodyear 205/60R16',4.00,16.00,8.000000000000000000000000000000,92,44,200,2400.00,2220.00,1750.00,'Sedán mediano confort',3,1,1,60.00,205.00,'Assurance TripleMax 2','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(18,'Llanta Continental 195/55R16',4.00,16.00,8.000000000000000000000000000000,87,44,200,1980.00,1820.00,1450.00,'Compacto económico',4,1,1,55.00,195.00,'EcoContact 6','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(19,'Llanta Michelin 245/70R17',6.00,17.00,11.000000000000000000000000000000,113,50,180,5300.00,4950.00,3850.00,'Pickup y 4x4 todoterreno',1,2,1,70.00,245.00,'LTX Trail','/Modelo3d/camaro_copo_tyre/scene.gltf',4),(20,'Llanta Bridgestone 185/70R14',4.00,14.00,8.000000000000000000000000000000,88,44,190,1580.00,1460.00,1150.00,'Auto compacto ciudad',2,1,1,70.00,185.00,'Ecopia EP150','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(21,'Llanta Goodyear 255/70R18',6.00,18.00,11.000000000000000000000000000000,113,50,180,5900.00,5500.00,4300.00,'Camioneta y SUV grande',3,2,1,70.00,255.00,'Wrangler Duratrac','/Modelo3d/camaro_copo_tyre/scene.gltf',5),(22,'Llanta Continental 225/65R17',6.00,17.00,10.000000000000000000000000000000,102,50,200,3600.00,3350.00,2600.00,'SUV crossover versátil',4,2,1,65.00,225.00,'CrossContact','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(23,'Llanta Michelin 215/55R17',4.00,17.00,9.000000000000000000000000000000,94,44,210,2900.00,2680.00,2100.00,'Sedán y compacto premium',1,1,1,55.00,215.00,'Primacy 4','/Modelo3d/camaro_copo_tyre/scene.gltf',2),(24,'Llanta Bridgestone 265/60R18',6.00,18.00,10.000000000000000000000000000000,110,50,200,4700.00,4380.00,3400.00,'SUV y pickup alto rendimiento',2,2,1,60.00,265.00,'Dueler H/T 684','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(25,'Llanta Goodyear 235/55R18',6.00,18.00,10.000000000000000000000000000000,99,50,210,4400.00,4100.00,3200.00,'SUV deportivo',3,2,1,55.00,235.00,'Eagle F1 Asymmetric','/Modelo3d/camaro_copo_tyre/scene.gltf',3),(26,'Llanta Continental 245/70R16',6.00,16.00,11.000000000000000000000000000000,111,50,180,4000.00,3720.00,2900.00,'Camioneta pesada y trabajo',4,3,1,70.00,245.00,'TerrainContact A/T','/Modelo3d/camaro_copo_tyre/scene.gltf',4);
/*!40000 ALTER TABLE `Producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto_Imagen`
--

DROP TABLE IF EXISTS `Producto_Imagen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto_Imagen` (
  `id_imagen` int NOT NULL AUTO_INCREMENT,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int NOT NULL,
  `id_producto` int NOT NULL,
  PRIMARY KEY (`id_imagen`),
  KEY `Producto_Imagen_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Producto_Imagen_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto_Imagen`
--

LOCK TABLES `Producto_Imagen` WRITE;
/*!40000 ALTER TABLE `Producto_Imagen` DISABLE KEYS */;
INSERT INTO `Producto_Imagen` VALUES (1,'1772573368918-558689175.jpg',1,1),(2,'1772573368918-558689175.jpg',1,2),(3,'1772573368918-558689175.jpg',1,3),(4,'1772573368918-558689175.jpg',1,4),(5,'1772573368918-558689175.jpg',1,5),(6,'1772573368918-558689175.jpg',1,6),(7,'1772573368918-558689175.jpg',1,7),(8,'1772573368918-558689175.jpg',1,8),(9,'1772573368918-558689175.jpg',1,9),(10,'1772573368918-558689175.jpg',1,10),(11,'1772573368918-558689175.jpg',1,11),(12,'1772573368918-558689175.jpg',1,12),(13,'1772573368918-558689175.jpg',1,13),(14,'1772573368918-558689175.jpg',1,14),(15,'1772573368918-558689175.jpg',1,15),(16,'1772573368918-558689175.jpg',1,16),(17,'1772573368918-558689175.jpg',1,17),(18,'1772573368918-558689175.jpg',1,18),(19,'1772573368918-558689175.jpg',1,19),(20,'1772573368918-558689175.jpg',1,20),(21,'1772573368918-558689175.jpg',1,21),(22,'1772573368918-558689175.jpg',1,22),(23,'1772573368918-558689175.jpg',1,23),(24,'1772573368918-558689175.jpg',1,24),(25,'1772573368918-558689175.jpg',1,25),(26,'1772573368918-558689175.jpg',1,26);
/*!40000 ALTER TABLE `Producto_Imagen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto_Ingreso`
--

DROP TABLE IF EXISTS `Producto_Ingreso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto_Ingreso` (
  `id_ingreso` int NOT NULL AUTO_INCREMENT,
  `fecha` timestamp NOT NULL,
  `proveedor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario` int NOT NULL,
  `id_bodega` int NOT NULL,
  `observaciones` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_ingreso`),
  KEY `Producto_Ingreso_id_usuario_fkey` (`id_usuario`),
  KEY `Producto_Ingreso_id_bodega_fkey` (`id_bodega`),
  CONSTRAINT `Producto_Ingreso_id_bodega_fkey` FOREIGN KEY (`id_bodega`) REFERENCES `Bodega` (`id_bodega`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_Ingreso_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto_Ingreso`
--

LOCK TABLES `Producto_Ingreso` WRITE;
/*!40000 ALTER TABLE `Producto_Ingreso` DISABLE KEYS */;
INSERT INTO `Producto_Ingreso` VALUES (1,'2026-06-30 18:47:16','Distribuidora Centroamericana',1,1,'Ingreso inicial de inventario'),(2,'2026-03-01 09:30:00','Importadora Premium',1,1,'Reposición de stock');
/*!40000 ALTER TABLE `Producto_Ingreso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto_Ingreso_Detalle`
--

DROP TABLE IF EXISTS `Producto_Ingreso_Detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto_Ingreso_Detalle` (
  `id_ingreso_detalle` int NOT NULL AUTO_INCREMENT,
  `id_ingreso` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `accion` enum('incremento','decremento') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_ingreso_detalle`),
  KEY `Producto_Ingreso_Detalle_id_ingreso_fkey` (`id_ingreso`),
  KEY `Producto_Ingreso_Detalle_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Producto_Ingreso_Detalle_id_ingreso_fkey` FOREIGN KEY (`id_ingreso`) REFERENCES `Producto_Ingreso` (`id_ingreso`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_Ingreso_Detalle_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto_Ingreso_Detalle`
--

LOCK TABLES `Producto_Ingreso_Detalle` WRITE;
/*!40000 ALTER TABLE `Producto_Ingreso_Detalle` DISABLE KEYS */;
INSERT INTO `Producto_Ingreso_Detalle` VALUES (1,1,1,10,15000.00,'incremento'),(2,1,2,8,12000.00,'incremento'),(3,2,1,5,7500.00,'incremento');
/*!40000 ALTER TABLE `Producto_Ingreso_Detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto_Promocion`
--

DROP TABLE IF EXISTS `Producto_Promocion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto_Promocion` (
  `id_producto` int NOT NULL,
  `id_promocion` int NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `precio_promocion` decimal(10,2) DEFAULT NULL,
  `tipo_descuento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'porcentaje',
  PRIMARY KEY (`id_producto`,`id_promocion`),
  KEY `Producto_Promocion_id_promocion_fkey` (`id_promocion`),
  CONSTRAINT `Producto_Promocion_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_Promocion_id_promocion_fkey` FOREIGN KEY (`id_promocion`) REFERENCES `Promocion` (`id_promocion`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto_Promocion`
--

LOCK TABLES `Producto_Promocion` WRITE;
/*!40000 ALTER TABLE `Producto_Promocion` DISABLE KEYS */;
INSERT INTO `Producto_Promocion` VALUES (1,1,10.00,NULL,'porcentaje'),(1,2,5.00,NULL,'porcentaje'),(2,1,15.00,NULL,'porcentaje'),(2,5,20.00,NULL,'porcentaje'),(3,1,12.00,NULL,'porcentaje'),(4,1,8.00,NULL,'porcentaje'),(5,5,18.00,NULL,'porcentaje'),(6,4,10.00,NULL,'porcentaje'),(7,4,8.00,NULL,'porcentaje'),(8,5,15.00,NULL,'porcentaje'),(10,4,12.00,NULL,'porcentaje'),(11,3,15.00,NULL,'porcentaje'),(12,3,10.00,NULL,'porcentaje'),(13,5,12.00,NULL,'porcentaje'),(14,3,12.00,NULL,'porcentaje'),(15,3,10.00,NULL,'porcentaje'),(16,4,15.00,NULL,'porcentaje'),(20,5,10.00,NULL,'porcentaje'),(22,4,10.00,NULL,'porcentaje');
/*!40000 ALTER TABLE `Producto_Promocion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Producto_Visitas`
--

DROP TABLE IF EXISTS `Producto_Visitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto_Visitas` (
  `id_visita` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `duracion_visita` int NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `es_invitado` tinyint(1) NOT NULL DEFAULT '1',
  `es_retorno` tinyint(1) NOT NULL DEFAULT '0',
  `id_sesion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_sucursal` int DEFAULT NULL,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_visita`),
  KEY `Producto_Visitas_id_producto_idx` (`id_producto`),
  KEY `Producto_Visitas_id_sucursal_fkey` (`id_sucursal`),
  KEY `Producto_Visitas_id_usuario_fkey` (`id_usuario`),
  KEY `Producto_Visitas_fecha_idx` (`fecha`),
  KEY `Producto_Visitas_id_sesion_idx` (`id_sesion`),
  CONSTRAINT `Producto_Visitas_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Producto_Visitas_id_sucursal_fkey` FOREIGN KEY (`id_sucursal`) REFERENCES `Sucursal` (`id_sucursal`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Producto_Visitas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto_Visitas`
--

LOCK TABLES `Producto_Visitas` WRITE;
/*!40000 ALTER TABLE `Producto_Visitas` DISABLE KEYS */;
/*!40000 ALTER TABLE `Producto_Visitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Promocion`
--

DROP TABLE IF EXISTS `Promocion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Promocion` (
  `id_promocion` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `banner_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` timestamp NOT NULL,
  `fecha_finalizacion` timestamp NOT NULL,
  `mostrar_precio_porcentaje` tinyint(1) NOT NULL DEFAULT '0',
  `mostrar_precio_tachado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_promocion`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Promocion`
--

LOCK TABLES `Promocion` WRITE;
/*!40000 ALTER TABLE `Promocion` DISABLE KEYS */;
INSERT INTO `Promocion` VALUES (1,'Promo Verano','Descuento especial en llantas seleccionadas','images.png','2026-03-01 00:00:00','2026-07-01 23:59:59',0,1),(2,'Promo Fin de Semana','Oferta limitada por fin de semana','brid.jpeg','2026-03-07 00:00:00','2026-06-09 23:59:59',0,1),(3,'Marcas Premium','Hasta 15% en Michelin y Continental','images.png','2026-03-01 00:00:00','2026-06-15 23:59:59',0,1),(4,'Llantas SUV','Oferta en medidas para SUV y camionetas','brid.jpeg','2026-03-10 00:00:00','2026-06-25 23:59:59',0,1),(5,'Buen Fin Llantas','Los mejores precios del año','images.png','2026-03-20 00:00:00','2026-07-01 23:59:59',0,1);
/*!40000 ALTER TABLE `Promocion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rol`
--

DROP TABLE IF EXISTS `Rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rol`
--

LOCK TABLES `Rol` WRITE;
/*!40000 ALTER TABLE `Rol` DISABLE KEYS */;
INSERT INTO `Rol` VALUES (1,'Admin','Administrador con acceso completo a todas las funciones del sistema',1),(2,'Vendedor','Vendedor con acceso a funciones relacionadas con ventas y clientes',1),(3,'Gestor','Gestor con acceso a funciones relacionadas con la gestión de recursos y proyectos',1),(4,'User','Usuario con acceso limitado a funciones básicas del sistema',1),(5,'Mayoreo','Usuario con acceso a funciones relacionadas con ventas al por mayor',1);
/*!40000 ALTER TABLE `Rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rol_Privilegio`
--

DROP TABLE IF EXISTS `Rol_Privilegio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rol_Privilegio` (
  `id_rol` int NOT NULL,
  `id_privilegio` int NOT NULL,
  PRIMARY KEY (`id_rol`,`id_privilegio`),
  KEY `Rol_Privilegio_id_privilegio_fkey` (`id_privilegio`),
  CONSTRAINT `Rol_Privilegio_id_privilegio_fkey` FOREIGN KEY (`id_privilegio`) REFERENCES `Privilegio` (`id_privilegio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Rol_Privilegio_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rol_Privilegio`
--

LOCK TABLES `Rol_Privilegio` WRITE;
/*!40000 ALTER TABLE `Rol_Privilegio` DISABLE KEYS */;
INSERT INTO `Rol_Privilegio` VALUES (3,5),(3,6),(5,7),(1,8),(3,9),(3,10),(2,11),(3,11),(2,12),(3,12),(3,13),(3,14),(3,15),(3,16),(3,17),(3,19),(2,20),(3,20),(4,21),(5,21);
/*!40000 ALTER TABLE `Rol_Privilegio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Stock_Bodega`
--

DROP TABLE IF EXISTS `Stock_Bodega`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Stock_Bodega` (
  `id_stock_bodega` int NOT NULL AUTO_INCREMENT,
  `existencias` int NOT NULL,
  `id_bodega` int NOT NULL,
  `id_producto` int NOT NULL,
  `fecha_actualizacion` timestamp NOT NULL,
  PRIMARY KEY (`id_stock_bodega`),
  KEY `Stock_Bodega_id_bodega_fkey` (`id_bodega`),
  KEY `Stock_Bodega_id_producto_fkey` (`id_producto`),
  CONSTRAINT `Stock_Bodega_id_bodega_fkey` FOREIGN KEY (`id_bodega`) REFERENCES `Bodega` (`id_bodega`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Stock_Bodega_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `Producto` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Stock_Bodega`
--

LOCK TABLES `Stock_Bodega` WRITE;
/*!40000 ALTER TABLE `Stock_Bodega` DISABLE KEYS */;
INSERT INTO `Stock_Bodega` VALUES (1,25,1,1,'2026-06-30 18:47:16'),(2,18,1,2,'2026-06-30 18:47:16'),(3,12,1,3,'2026-06-30 18:47:16'),(4,30,1,4,'2026-06-30 18:47:16'),(5,20,1,5,'2026-06-30 18:47:16'),(6,15,1,6,'2026-06-30 18:47:16'),(7,22,1,7,'2026-06-30 18:47:16'),(8,28,1,8,'2026-06-30 18:47:16'),(9,14,1,9,'2026-06-30 18:47:16'),(10,10,1,10,'2026-06-30 18:47:16'),(11,17,1,11,'2026-06-30 18:47:16'),(12,21,1,12,'2026-06-30 18:47:16'),(13,13,1,13,'2026-06-30 18:47:16'),(14,19,1,14,'2026-06-30 18:47:16'),(15,11,1,15,'2026-06-30 18:47:16'),(16,9,1,16,'2026-06-30 18:47:16'),(17,16,1,17,'2026-06-30 18:47:16'),(18,8,1,18,'2026-06-30 18:47:16'),(19,14,1,19,'2026-06-30 18:47:16'),(20,22,1,20,'2026-06-30 18:47:16'),(21,11,1,21,'2026-06-30 18:47:16'),(22,9,1,22,'2026-06-30 18:47:16'),(23,17,1,23,'2026-06-30 18:47:16'),(24,13,1,24,'2026-06-30 18:47:16'),(25,20,1,25,'2026-06-30 18:47:16'),(26,10,1,26,'2026-06-30 18:47:16'),(27,20,2,1,'2026-06-30 18:47:16'),(28,16,2,2,'2026-06-30 18:47:16'),(29,8,2,3,'2026-06-30 18:47:16'),(30,25,2,4,'2026-06-30 18:47:16'),(31,18,2,5,'2026-06-30 18:47:16'),(32,12,2,6,'2026-06-30 18:47:16'),(33,19,2,7,'2026-06-30 18:47:16'),(34,24,2,8,'2026-06-30 18:47:16'),(35,11,2,9,'2026-06-30 18:47:16'),(36,7,2,10,'2026-06-30 18:47:16'),(37,14,2,11,'2026-06-30 18:47:16'),(38,18,2,12,'2026-06-30 18:47:16'),(39,10,2,13,'2026-06-30 18:47:16'),(40,15,2,14,'2026-06-30 18:47:16'),(41,9,2,15,'2026-06-30 18:47:16'),(42,7,2,16,'2026-06-30 18:47:16'),(43,12,2,17,'2026-06-30 18:47:16'),(44,6,2,18,'2026-06-30 18:47:16'),(45,11,2,19,'2026-06-30 18:47:16'),(46,18,2,20,'2026-06-30 18:47:16'),(47,9,2,21,'2026-06-30 18:47:16'),(48,7,2,22,'2026-06-30 18:47:16'),(49,14,2,23,'2026-06-30 18:47:16'),(50,10,2,24,'2026-06-30 18:47:16'),(51,16,2,25,'2026-06-30 18:47:16'),(52,8,2,26,'2026-06-30 18:47:16');
/*!40000 ALTER TABLE `Stock_Bodega` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Sucursal`
--

DROP TABLE IF EXISTS `Sucursal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RTN` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `id_municipio` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `direccion` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  KEY `Sucursal_id_municipio_fkey` (`id_municipio`),
  KEY `Sucursal_id_usuario_fkey` (`id_usuario`),
  CONSTRAINT `Sucursal_id_municipio_fkey` FOREIGN KEY (`id_municipio`) REFERENCES `Municipio` (`id_municipio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Sucursal_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Sucursal`
--

LOCK TABLES `Sucursal` WRITE;
/*!40000 ALTER TABLE `Sucursal` DISABLE KEYS */;
INSERT INTO `Sucursal` VALUES (1,'Sucursal San Pedro Sula','08011999123456',1,79,1,'Calle Principal 123, San Pedro Sula',15.5,-88),(2,'Sucursal Tegucigalpa','08011999123457',1,110,1,'Avenida Central 456, Tegucigalpa',14,-87.2);
/*!40000 ALTER TABLE `Sucursal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuario`
--

DROP TABLE IF EXISTS `Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clave` varchar(72) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `id_rol` int NOT NULL,
  `primer_apellido` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primer_nombre` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `segundo_apellido` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `segundo_nombre` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `Usuario_usuario_key` (`usuario`),
  UNIQUE KEY `Usuario_correo_key` (`correo`),
  KEY `Usuario_id_rol_fkey` (`id_rol`),
  CONSTRAINT `Usuario_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuario`
--

LOCK TABLES `Usuario` WRITE;
/*!40000 ALTER TABLE `Usuario` DISABLE KEYS */;
INSERT INTO `Usuario` VALUES (1,'admin','admin@example.com','$2b$10$8P9.5L8l0aYm2/fl8NKaHeYmGnfffyCeVBWiSTE68HXW7aEND4sk.','1234567890',1,1,'Admin','Admin','Min','Min'),(2,'Vendedor1','vendedor1@example.com','$2b$10$1jgV/edapGdDDAbRChj.t.j1wjuHFnYD.V.MU0TlE8.tLW2mlwtWa','1122334455',1,2,'Vendedor','Vendedor','Uno','Uno'),(3,'Gestor1','gestor1@example.com','$2b$10$2gBRAYYPwVFAuqY8VX6JIe6nOr.Nb/2clj6XbQa14upUSyQt..EZW','2233445566',1,3,'Gestor','Gestor','Uno','Uno'),(4,'user1','user1@example.com','$2b$10$Q1QMOC2Y72qoF15LHRaefOeAxqgVJgD29IOqPQ9vGO9efE4xtrAKG','0987654321',1,4,'User','User','One','One'),(5,'user2','user2@example.com','$2b$10$sDr3k8Ctx5TBPFVYFnOLm.nSHOG9MbYhbps2Z0AN81IBG6DJvlTTO','0987654322',1,4,'User','User','Two','Two'),(6,'mayoreo','mayoreo@example.com','$2b$10$Gu6X8gpggPfMiLkG9QCEVOSjMCp4pX9vYspDRXj5z7tv/e8vGupk.','0987654323',1,5,'Mayoreo','Mayoreo','User','User');
/*!40000 ALTER TABLE `Usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuario_Notificacion`
--

DROP TABLE IF EXISTS `Usuario_Notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario_Notificacion` (
  `id_usuario` int NOT NULL,
  `id_notifiacion` int NOT NULL,
  `leida` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_notifiacion`),
  KEY `Usuario_Notificacion_id_notifiacion_fkey` (`id_notifiacion`),
  CONSTRAINT `Usuario_Notificacion_id_notifiacion_fkey` FOREIGN KEY (`id_notifiacion`) REFERENCES `Notificacion` (`id_notificacion`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Usuario_Notificacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuario_Notificacion`
--

LOCK TABLES `Usuario_Notificacion` WRITE;
/*!40000 ALTER TABLE `Usuario_Notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `Usuario_Notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Visita_Usuario`
--

DROP TABLE IF EXISTS `Visita_Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Visita_Usuario` (
  `id_visita` int NOT NULL AUTO_INCREMENT,
  `fecha` timestamp NOT NULL,
  PRIMARY KEY (`id_visita`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Visita_Usuario`
--

LOCK TABLES `Visita_Usuario` WRITE;
/*!40000 ALTER TABLE `Visita_Usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `Visita_Usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1542e1e3-d22a-4375-bc99-c47d5c3439aa','0206472a4756c3d9f15184db2c87a43e307e1d665546aff158b95980ebda1a5c','2026-06-29 21:24:23.324','20260516203548_',NULL,NULL,'2026-06-29 21:24:23.188',1),('240b6864-aefa-4449-96dd-1051355816c3','98dc649235f7b9629cd091b0f8b278950f2eabdcba944476a63a74e620ba18a3','2026-06-29 21:24:22.390','20260506220000_add_ruta_to_notification',NULL,NULL,'2026-06-29 21:24:22.327',1),('29c8c379-739e-4aef-8916-5f50a4abcdd7','46e5b7f1b1cddaae4b7b9c84761370a7c82d98360fca963e88f8979056ac29b1','2026-06-29 21:24:23.744','20260525140000_add_versions_table',NULL,NULL,'2026-06-29 21:24:23.364',1),('307ef48a-08c8-455b-97f5-863ce0c66fd8','e17e58081b660ff69656456bb8160cce3f2cbcf614067a2fb261cf8cd5a68513','2026-06-29 21:24:22.322','20260429161554_beta_brand_design',NULL,NULL,'2026-06-29 21:24:22.041',1),('3ab15f06-54f3-40b4-80f2-97ced5d2aef0','cec27c6727211ce2afe79caa41ba170956c746d2fdd215d036b84a21d84e0e4e','2026-06-29 21:24:21.166','20260310174723_intermediate_model_product',NULL,NULL,'2026-06-29 21:24:18.875',1),('43401673-51d9-4f9b-9436-4e2646409da1','518654542c858adef76204e7e7e3e5eb6cf672dbfedd4677827c7257bd4ba22f','2026-06-29 21:24:14.493','20260308013230_add_empleado_usuario',NULL,NULL,'2026-06-29 21:24:14.298',1),('444f9864-d231-44a7-a0a6-a7a31cfbac71','39cf070b7937b70c605c1523dfb78fbecd0a035b42f6ee751d9c20e40f6b65ee','2026-06-29 21:24:21.302','20260311182505_fecha_aprox_for_pedido',NULL,NULL,'2026-06-29 21:24:21.229',1),('4a2270ae-0fa8-414c-9784-034d0c23e3b0','59fe94aeb7e962f02de3c43263b3c5b5761494980f7735feb7e724514ac5f003','2026-06-29 21:24:23.968','20260525235959_add_tipo_descuento',NULL,NULL,'2026-06-29 21:24:23.913',1),('52c5fb58-4427-49fc-8092-17f167300e62','a3aa8372f15968c068f89b88eb1220435233a9de26151c84f103df1bad41aa78','2026-06-29 21:24:21.574','20260422123405_heydencito',NULL,NULL,'2026-06-29 21:24:21.517',1),('52e91d93-8e50-4f79-b591-f918dd78b36d','aadcbf298f2f43fb32826e2379179829f7852e424b2649d6910f5b63e5df3333','2026-06-29 21:24:21.633','20260422212500_add_activo_to_rol',NULL,NULL,'2026-06-29 21:24:21.579',1),('55cfeadc-81ed-4b5c-aa1f-6f5605ef8150','50a8a9d64d3d5b4c0909fef7f36bf11e1ebe15371614bb4296df96e44ce46869','2026-06-29 21:24:14.295','20260307204136_cat_activo',NULL,NULL,'2026-06-29 21:24:14.246',1),('562173e8-0161-435d-aff7-1609cb46f580','d3bdc95ccec9e30831400722bf3e4cb28375608a034def35c7b425103e72c4f1','2026-06-29 21:24:13.849','20260303081258_make_correo_unique',NULL,NULL,'2026-06-29 21:24:13.741',1),('6db75870-745d-4d1f-b963-330559b694bb','094d06025bdf15d1c477c7da4c9d47fd64714710f9238b2dd80617967022bb26','2026-06-29 21:24:18.662','20260310151455_model_change',NULL,NULL,'2026-06-29 21:24:14.498',1),('6dc26c23-8af7-4d0d-afbd-28f86eda75ca','86a637cf3bdc521ff5ad1e1221c6c40e13687efbfacd95e2d72706a8e79fbf49','2026-06-29 21:24:13.926','20260303182234_heydencito',NULL,NULL,'2026-06-29 21:24:13.852',1),('7e5e47ac-a837-417d-a69e-c91d0a6b0ba4','3e42fe2d19b00a823b87c6f656ec25967016ba7b6a6783ff727c699e86ef21ec','2026-06-29 21:24:23.848','20260525203549_change_descuento_to_decimal',NULL,NULL,'2026-06-29 21:24:23.782',1),('81e4fb21-1816-403a-86a7-3d11db418306','624e89f63e9742025c5345c788652bfb047afe33c92b7028d358583410a5ac40','2026-06-29 21:24:21.512','20260421120000_add_bodega_active',NULL,NULL,'2026-06-29 21:24:21.454',1),('8966d054-6b35-4460-a35f-f65a274523c7','ceb51adf9833bff47f5f62f630ec2383b683dbfaafcbc62883b3e4eb8be20445','2026-06-29 21:24:21.449','20260319162816_fix_product',NULL,NULL,'2026-06-29 21:24:21.390',1),('8d4d2200-2c84-42ea-82ac-bd6d936fcefb','ed0ecf9f79836551644760de43844dcdd7e9c7e2f3e78f2f90ce5b28c70de3c9','2026-06-29 21:24:13.623','20260301194456_web_inversan_test',NULL,NULL,'2026-06-29 21:24:12.038',1),('8f2d3ed3-7b68-4c98-973f-d8ef0dcc0d48','4ef6256b04e922efc65ddcaaf419c5bf3f9322c25059fff4e8ca07f49c8cec5e','2026-06-29 21:24:21.730','20260423032346_reporte_de_visitas',NULL,NULL,'2026-06-29 21:24:21.637',1),('9250fa81-4484-42a5-8632-c224cefc8729','5e408284431bd4e2284424797256c6c1f1de1952f00c2b3864ae97d5f4edcc89','2026-06-29 21:24:12.035','20260225040754_init',NULL,NULL,'2026-06-29 21:24:08.660',1),('96cb6d9d-e321-4a47-9e3d-4afb2030cb53','d9e03f97d8ac6f5d9e0aab6fe6043bceb4f0bbefd7af738318bb3578f4377b48','2026-06-29 21:24:23.183','20260514222301_carrito',NULL,NULL,'2026-06-29 21:24:22.842',1),('99ac300b-2c84-4898-b163-0c57c3c5dddb','08e749ddee634b06969d238bfde498dd6906c308a63a624d692f656e04345135','2026-06-29 21:24:22.038','20260426230249_add_report_fields',NULL,NULL,'2026-06-29 21:24:21.735',1),('a42fe1da-2772-4fe9-b109-860c620b7f03','1d8368a2bc8eb1427cd591f81b1b9c2ccf501006b107953542e6de0f57fda372','2026-06-29 21:24:21.224','20260310191710_logic_delete_model',NULL,NULL,'2026-06-29 21:24:21.170',1),('a8ab3cc6-362d-43a1-b30d-1aa03af3e49f','6a70d03a6e1e0d79b544f429701e75a49b97c29ae822a363054e66da6f6db397','2026-06-29 21:24:23.907','20260525231631_add_precio_promocion',NULL,NULL,'2026-06-29 21:24:23.852',1),('a9e06d13-10b9-4e98-af9a-b7ea80439818','cbecb6d43acd9dca8ae3bd621637b75101c2f0ea06aefc5582a22f50346c1a05','2026-06-29 21:24:13.738','20260301231613_heyden',NULL,NULL,'2026-06-29 21:24:13.670',1),('b1e811d3-e447-470d-a166-1afa3f8fe95e','4d29c2a10cfd1775e98789e4a04636caea46944a216b816a5f0c8977bc6cea43','2026-06-29 21:24:23.359','20260525120000_add_deactivation_triggers',NULL,NULL,'2026-06-29 21:24:23.327',1),('bccb335c-7c9b-49d0-a4aa-b3663c7bdd34','23d65619a22fe6118700d29c91bd42973c87ec9d428954ff0ea4b73f69f6b0e5','2026-06-29 21:24:21.385','20260317202821_add_marca_in_modelo',NULL,NULL,'2026-06-29 21:24:21.308',1),('c8f295f8-4c27-41ba-9705-9271e50b486c','40a7a6a9431cbe3a4f4304901c03d17c5ae6aeb9fa387d65d58e81110ab3e423','2026-06-29 21:24:13.667','20260301222414_heyden',NULL,NULL,'2026-06-29 21:24:13.627',1),('c97e8cbd-9a7b-4888-98c8-28971173f819','fdaba5f5b35d567d73155bca0c434ea71b8183c4851ee96bc4394098c3dd2df1','2026-06-29 21:24:14.166','20260305193829_add_imagen_3d',NULL,NULL,'2026-06-29 21:24:13.995',1),('d88bb062-e95f-423a-bf5c-ca313732f636','be056a1c9dcdfcd9293dbad658267158ae94476c1eaeef29e15af70a6a9823ee','2026-06-29 21:24:23.778','20260525161141_unique_name_year_on_model',NULL,NULL,'2026-06-29 21:24:23.748',1),('d93fcaab-d71c-4bad-9f5c-07fb5d1d7401','35c84b90f22e3e5ebdc1df3e91e9015ee975fd334ec49fe7556621ac751b2ffd','2026-06-29 21:24:13.992','20260303183000_add_sucursal_location',NULL,NULL,'2026-06-29 21:24:13.931',1),('e288e0e5-dcc2-478f-a50e-85a715137009','8ae6b52eeba775fb88a93efe39b97f7470cab08e9258a5e141d1d18f4aeddbbe','2026-06-29 21:24:22.837','20260513041818_fix_float_products_and_indexes_keys',NULL,NULL,'2026-06-29 21:24:22.394',1),('f0fba6db-478f-467b-937a-4ba47ffec128','e0f6bdad9a2131e85b690c4ead5fda508e29c3b976769c7bb2a6e2487bc16ecf','2026-06-29 21:24:14.242','20260307194153_add_comprobante_url_to_pedido',NULL,NULL,'2026-06-29 21:24:14.170',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sugerencia`
--

DROP TABLE IF EXISTS `sugerencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sugerencia` (
  `id_sugerencia` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL,
  PRIMARY KEY (`id_sugerencia`),
  KEY `sugerencia_id_usuario_fkey` (`id_usuario`),
  CONSTRAINT `sugerencia_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sugerencia`
--

LOCK TABLES `sugerencia` WRITE;
/*!40000 ALTER TABLE `sugerencia` DISABLE KEYS */;
INSERT INTO `sugerencia` VALUES (1,1,'recomendacion','Agregar filtro por marca','Sería útil permitir búsquedas rápidas de productos por marca.','2026-03-01 09:00:00'),(2,3,'queja','Problema con el carrito','El carrito no actualiza correctamente la cantidad de productos.','2026-03-01 09:30:00'),(3,5,'recomendacion','Métodos de pago','Sería bueno mostrar mejor los métodos de pago disponibles antes de finalizar la compra.','2026-03-01 10:00:00');
/*!40000 ALTER TABLE `sugerencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `versiones`
--

DROP TABLE IF EXISTS `versiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `versiones` (
  `id_version` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_modelo` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_version`),
  KEY `versiones_id_modelo_fkey` (`id_modelo`),
  CONSTRAINT `versiones_id_modelo_fkey` FOREIGN KEY (`id_modelo`) REFERENCES `Modelo` (`id_modelo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `versiones`
--

LOCK TABLES `versiones` WRITE;
/*!40000 ALTER TABLE `versiones` DISABLE KEYS */;
/*!40000 ALTER TABLE `versiones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-30 19:08:24
