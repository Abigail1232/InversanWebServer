const { insertRoles } = require("./Roles");
const { Privilegios } = require("./privilegios");
const { insertRolPrivilegio } = require("./rol_privilegio");
const { insertUsuarios } = require("./usuarios");
const { insertDepartamentos } = require("./departamento");
const { insertMunicipios } = require("./municipio");
const { insertSucursal } = require("./sucursal");
const { insertBodegas } = require("./bodega");
const { insertCategorias } = require("./categoria");
const { insertMarcas } = require("./marca");
const { insertProductos } = require("./producto");
const { insertStockBodega } = require("./stock_bodega");
const { insertPedidos } = require("./pedido");
const { insertPedidoUsuario } = require("./pedido_usuario");
const { insertPedidoDetalle } = require("./pedido_detalle");
const { insertPedidoAsignacion } = require("./pedido_asignacion");
const { insertFacturas } = require("./factura");
const { insertFacturaDetalle } = require("./factura_detalle");

const { insertVisitaUsuario } = require("./visita_usuario");
const { insertModeloProducto } = require("./modelo_producto");
const { insertModelo } = require("./modelo");
const { insertProductoImagen } = require("./producto_imagen");
const { insertPromocion } = require("./promocion");
const { insertProductoIngreso } = require("./producto_ingreso");
const { insertProductoIngresoDetalle } = require("./producto_ingreso_detalle");
const { insertProductoPromocion } = require("./producto_promocion");
const { insertNotificacion } = require("./notificacion");
const { insertUsuarioNotificacion } = require("./usuario_notificacion");
const { insertDevolucion } = require("./devolucion");
const { insertDevolucionDetalle } = require("./devolucion_detalle");
const { insertSugerencias } = require("./sugerencia");
const { insertEmpleadoSucursal } = require("./empleado_sucursal")
const { insertDisenos } = require("./diseno");

async function main() {
  try {
    await insertRoles();
    await Privilegios();
    await insertRolPrivilegio();
    await insertUsuarios();

    await insertDepartamentos();
    await insertMunicipios();
    await insertSucursal();
    await insertBodegas();
    await insertEmpleadoSucursal();

    await insertCategorias();
    await insertMarcas();
    await insertDisenos();
    await insertProductos();
    await insertModelo();
    await insertModeloProducto();
    await insertProductoImagen();
    await insertStockBodega();

    // await insertPedidos();
    // await insertPedidoUsuario();
    // await insertPedidoDetalle();
    // await insertPedidoAsignacion();

    // await insertFacturas();
    // await insertFacturaDetalle();

    await insertPromocion();
    await insertProductoPromocion();

    await insertProductoIngreso();
    await insertProductoIngresoDetalle();

    await insertNotificacion();
    await insertUsuarioNotificacion();

    await insertVisitaUsuario();

    // await insertDevolucion();
    // await insertDevolucionDetalle();

    await insertSugerencias();

    console.log("Seeders ejecutados correctamente");
  } catch (error) {
    console.error("Error al ejecutar seeders:", error);
  }
}

main();
