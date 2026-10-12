const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");

const standardProduct = {
  id_producto: 124,
  nombre: "RXMotion",
  precio_detalle: 4400,
  precio_mayoreo: 0,
  ancho_rin: 265,
  alto_rin: 65,
  rin: 17,
  marca: { id_marca: 1, nombre: "RoadX" },
  diseno: { nombre: "RXMotion" },
  categoria: { nombre: "Llanta" },
  modelo_producto: [],
  producto_imagen: [{ imagen_url: "tire.jpg", orden: 1 }],
  stock_bodega: [{ existencias: 4, bodega: { sucursal: { id_sucursal: 1 } } }],
  producto_promocion: [],
};

const promotionalProduct = {
  ...standardProduct,
  producto_imagen: [],
  stock_bodega: [{ existencias: 4 }],
};

const prisma = {
  producto: {
    count: async () => 1,
    findMany: async () => [standardProduct],
    findUnique: async () => ({
      id_marca: 1,
      ancho_rin: 265,
      alto_rin: 65,
      rin: 17,
    }),
  },
  marca: {
    findUnique: async () => ({
      nombre: "RoadX",
      logo_url: null,
      banner_url: null,
    }),
  },
  promocion: {
    findUnique: async () => ({
      id_promocion: 1,
      titulo: "Promoción",
      descripcion: "",
      banner_url: null,
      fecha_inicio: new Date("2026-01-01"),
      fecha_finalizacion: new Date("2026-12-31"),
      mostrar_precio_porcentaje: false,
      mostrar_precio_tachado: true,
    }),
  },
  producto_Promocion: {
    count: async () => 1,
    findMany: async () => [
      {
        descuento: 10,
        tipo_descuento: "porcentaje",
        producto: promotionalProduct,
      },
    ],
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (
    request === "../config/database" &&
    parent?.filename?.includes(`${path.sep}Services${path.sep}`)
  ) {
    return prisma;
  }
  return originalLoad.call(this, request, parent, isMain);
};

const productsClientService = require("./ProductsClientService");
const promocionesService = require("./PromocionesService");
const llantasService = require("./LlantasService");
Module._load = originalLoad;

test("product listing services select and return SEO dimensions without per-product lookups", async () => {
  const search = await productsClientService.buscarProductos({
    busqueda: "RoadX",
  });
  assert.deepEqual(
    {
      width: search.data[0].width,
      profile: search.data[0].profile,
      rim: search.data[0].rim,
      design: search.data[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );

  const byBrand = await productsClientService.obtenerProductosPorMarca({
    id_marca: "1",
  });
  assert.deepEqual(
    {
      width: byBrand.datos.productos[0].width,
      profile: byBrand.datos.productos[0].profile,
      rim: byBrand.datos.productos[0].rim,
      design: byBrand.datos.productos[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );

  const catalog = await productsClientService.obtenerProductos({});
  assert.deepEqual(
    {
      width: catalog.data[0].width,
      profile: catalog.data[0].profile,
      rim: catalog.data[0].rim,
      design: catalog.data[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );

  const related = await productsClientService.obtenerProductosRelacionados(
    "123",
    {},
  );
  assert.deepEqual(
    {
      width: related[0].products[0].width,
      profile: related[0].products[0].profile,
      rim: related[0].products[0].rim,
      design: related[0].products[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );
});

test("promotion and tire-filter listings return SEO dimensions and design", async () => {
  const promotion = await promocionesService.obtenerDetallePromocionProductos(
    "1",
    undefined,
  );
  assert.deepEqual(
    {
      width: promotion.productos[0].width,
      profile: promotion.productos[0].profile,
      rim: promotion.productos[0].rim,
      design: promotion.productos[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );

  const filtered = await llantasService.obtenerFiltrosLlantas({});
  assert.deepEqual(
    {
      width: filtered.productos[0].width,
      profile: filtered.productos[0].profile,
      rim: filtered.productos[0].rim,
      design: filtered.productos[0].design,
    },
    { width: 265, profile: 65, rim: 17, design: "RXMotion" },
  );
});
