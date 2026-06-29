const router = require("express").Router();
const productosController = require("../Controllers/products");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const upload = require("../middleware/uploads");

// ===== RUTAS PÚBLICAS (sin token) =====
router.get("/filtro_rines", productosController.obtenerFiltrosLlantas);
router.get("/detalle-producto/:id", productosController.detalleProducto);
router.get("/productos", productosController.obtenerProductos);
router.get("/busqueda-productos", productosController.buscarProductos);
router.get(
  "/promocion-productos/:id",
  productosController.obtenerDetallePromocionProductos
);
router.get("/todos-modelos", productosController.obtenerTodosModelos);
router.get("/categorias", productosController.obtenerCategorias);
router.get("/marcas", productosController.obtenerMarcas);
router.get("/productos-marcas", productosController.obtenerProductosPorMarca);
router.get("/marcas-nombres", productosController.obtenerNombreMarcas);
router.get("/rines", productosController.obtenerRines);
router.get("/marca-anios", productosController.obtenerAniosPorMarca);
router.get("/marca-modelos", productosController.obtenerModelosPorMarcaYAnio);
router.get(
  "/marca-versiones",
  productosController.obtenerVersionesPorMarcaYModelo
);
router.get("/rin-specs/:rin", productosController.obtenerEspecificacionesRin);
router.get("/info-filter-marca", productosController.obtenerModelosPorMarca);
router.get("/promociones", productosController.obtenerPromociones);
router.get(
  "/especificaciones-existentes",
  productosController.obtenerEspecificacionesExistentes
);

// ===== RUTAS QUE REQUIEREN LOGIN PERO NO PRIVILEGIOS ESPECÍFICOS =====
router.get(
  "/",
  verificarToken,
  productosController.obtenerProductosParaAdminProductos
);

// ===== GESTIÓN DE PRODUCTOS — requiere ADM_PRODUCTOS =====
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PRODUCTOS),
  upload.fields([
    { name: "imagenes", maxCount: 10 },
    { name: "modelo_3d_files", maxCount: 10 },
  ]),
  productosController.crearProducto
);

// ===== GESTIÓN DE PROMOCIONES — requiere ADM_PROMOCIONES =====
router.put(
  "/promocion/:id/config-visualizacion",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  productosController.actualizarConfigVisualizacion
);

// ===== GESTIÓN DE CATEGORÍAS — requiere ADM_CATEGORIAS =====
router.post(
  "/crear_categoria",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_CATEGORIAS),
  upload.single("imagen"),
  productosController.crearCategoria
);
router.put(
  "/modificar_categoria/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_CATEGORIAS),
  upload.single("imagen"),
  productosController.modificarCategoria
);
router.patch(
  "/eliminar_categoria/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_CATEGORIAS),
  productosController.eliminar_categoria
);

// ===== RUTAS DINÁMICAS (al final por orden de prioridad) =====
router.get("/:id/related", productosController.obtenerProductosRelacionados);
router.get("/:id", productosController.obtenerProductoPorId);

router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PRODUCTOS),
  upload.fields([
    { name: "imagenes", maxCount: 10 },
    { name: "modelo_3d_files", maxCount: 10 },
  ]),
  productosController.actualizarProducto
);
router.patch(
  "/:id/estado",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PRODUCTOS),
  productosController.cambiarEstadoProducto
);

module.exports = router;
