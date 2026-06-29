const prisma = require("../config/database");

async function seedTestVentas() {
  console.log("Generando 15 pedidos 'entregado' para probar reportes de ventas...");

  // Obtener algunos productos
  const productos = await prisma.producto.findMany({
    select: { id_producto: true, precio_detalle: true },
    take: 5,
  });

  if (productos.length === 0) {
    throw new Error("No hay productos en la base de datos.");
  }

  // Obtener sucursales
  const sucursales = await prisma.sucursal.findMany({
    select: { id_sucursal: true },
  });

  const sucursalDefault = sucursales.length > 0 ? sucursales[0].id_sucursal : 1;

  // Obtener un usuario (puede ser repartidor y usuario_asignador)
  const usuario = await prisma.usuario.findFirst();
  const idUsuario = usuario ? usuario.id_usuario : 1;

  // Obtener un municipio
  const municipio = await prisma.municipio.findFirst();
  const idMunicipio = municipio ? municipio.id_municipio : 1;

  const tiposPago = [
    "efectivo",
    "transferencia_bancaria",
    "pos",
    "compra_click",
    "pay_pal",
  ];
  
  const tiposCliente = ["registrado", "invitado"];

  for (let i = 1; i <= 15; i++) {
    const prod = productos[i % productos.length];
    const cant = 1 + (i % 4);
    const subtotal = Number(prod.precio_detalle) * cant;
    const iva = subtotal * 0.15;
    const total = subtotal + iva;
    const tipoPago = tiposPago[i % tiposPago.length];
    const tipoCliente = tiposCliente[i % 2];
    
    // Fecha variable (algunos hoy, algunos dias atras)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - (i % 5));

    await prisma.pedido.create({
      data: {
        numero_pedido: `PED-TEST-${Date.now()}-${i}`,
        descuento: 0,
        subtotal: subtotal,
        costo_envio: 0,
        total: total,
        IVA: iva,
        tipo_de_entrega: "a_domicilio",
        tipo_de_pago: tipoPago,
        estado: "entregado",
        fecha: fecha,
        id_sucursal: sucursalDefault,
        id_municipio_entrega: idMunicipio,
        direccion: `Dirección Test ${i}`,
        pedido_detalle: {
          create: {
            id_producto: prod.id_producto,
            cantidad: cant,
            precio_unitario: prod.precio_detalle,
            subtotal: subtotal,
            total: subtotal,
          },
        },
        pedido_usuario: {
          create: {
            tipo_cliente: tipoCliente,
            nombre_completo: `Cliente Test ${i}`,
            telefono_cliente: "12345678",
            correo_cliente: `test${i}@correo.com`,
            fecha: fecha,
            id_usuario: tipoCliente === "registrado" ? idUsuario : null,
          },
        },
        pedido_asignacion: {
          create: {
            observacion: "Asignación Test",
            fecha_asignacion: fecha,
            id_repartidor: idUsuario,
            asignado_por: idUsuario,
            estado_asignacion: "asignado",
            activo: true,
          },
        },
        factura: {
          create: {
            numero_factura: `FAC-TEST-${Date.now()}-${i}`,
            fecha_emision: fecha,
            id_pedido_usuario: 1, // Se actualizará después
            id_usuario_emisor: idUsuario,
            subtotal: subtotal,
            descuento: 0,
            iva: iva,
            costo_envio: 0,
            total: total,
            tipo_de_pago: tipoPago,
            estado: "emitida",
            observacion: "Factura Test",
            factura_detalle: {
              create: {
                id_producto: prod.id_producto,
                cantidad: cant,
                precio_unitario: prod.precio_detalle,
                descuento: 0,
                subtotal: subtotal,
                total: subtotal,
              }
            }
          }
        }
      },
    });
  }

  // Corregir id_pedido_usuario de la factura
  const pedidosCreados = await prisma.pedido.findMany({
    where: { numero_pedido: { startsWith: "PED-TEST-" } },
    include: {
      pedido_usuario: true,
      factura: true,
    }
  });

  for (const pedido of pedidosCreados) {
    if (pedido.factura && pedido.pedido_usuario && pedido.pedido_usuario.length > 0) {
      await prisma.factura.update({
        where: { id_factura: pedido.factura.id_factura },
        data: { id_pedido_usuario: pedido.pedido_usuario[0].id_pedido_usuario }
      });
    }
  }

  console.log("¡Se insertaron exitosamente 15 pedidos test de ventas!");
}

seedTestVentas()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
