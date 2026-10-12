const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createSeoPublicService,
  productPublicFields,
} = require("./SeoPublicService");

function makeProduct(overrides = {}) {
  return {
    id_producto: 10,
    nombre: "RXMotion",
    descripcion: "Llanta RoadX",
    precio_detalle: "4400.00",
    ancho_rin: "265.00",
    alto_rin: "65.00",
    rin: "17.00",
    marca: { nombre: "RoadX" },
    diseno: { nombre: "RXMotion" },
    producto_imagen: [{ imagen_url: "llantas/rxmotion.jpg", orden: 1 }],
    stock_bodega: [{ existencias: 2 }, { existencias: 3 }],
    producto_promocion: [],
    precio_coste: "900",
    precio_mayoreo: "1000",
    ...overrides,
  };
}

function promotion({
  descuento,
  tipo_descuento = "porcentaje",
  precio_promocion = null,
  fecha_inicio = "2025-01-01T00:00:00.000Z",
  fecha_finalizacion = "2027-01-01T00:00:00.000Z",
} = {}) {
  return {
    descuento,
    tipo_descuento,
    precio_promocion,
    promocion: {
      titulo: "Promo",
      fecha_inicio,
      fecha_finalizacion,
      mostrar_precio_porcentaje: tipo_descuento !== "monto",
      mostrar_precio_tachado: tipo_descuento === "monto",
    },
  };
}

test("public SEO product projection contains general stock and public price only", () => {
  const product = productPublicFields(makeProduct(), new Date("2026-01-01"));
  assert.equal(product.id, "10");
  assert.equal(product.price, 4400);
  assert.equal(product.stock, 5);
  assert.equal(product.width, "265.00");
  assert.equal(product.imageUrl, "llantas/rxmotion.jpg");
  assert.equal("precio_coste" in product, false);
  assert.equal("precio_mayoreo" in product, false);
  assert.equal("stock_bodega" in product, false);
});

test("public SEO product projection applies active percent and fixed promotions only", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(
    productPublicFields(
      makeProduct({ producto_promocion: [promotion({ descuento: 10 })] }),
      now,
    ).price,
    3960,
  );
  assert.equal(
    productPublicFields(
      makeProduct({
        producto_promocion: [
          promotion({
            descuento: 10,
            tipo_descuento: "monto",
            precio_promocion: 3500,
          }),
        ],
      }),
      now,
    ).price,
    3500,
  );
  assert.equal(
    productPublicFields(
      makeProduct({
        producto_promocion: [
          promotion({
            descuento: 10,
            fecha_inicio: "2024-01-01T00:00:00.000Z",
            fecha_finalizacion: "2025-01-01T00:00:00.000Z",
          }),
        ],
      }),
      now,
    ).price,
    4400,
  );
});

test("size landing returns exact-size products, sorts available first, and paginates", async () => {
  const database = {
    producto: {
      findMany: async (query) => {
        assert.equal(query.where.estado, true);
        assert.equal(String(query.where.ancho_rin), "265");
        assert.equal(String(query.where.alto_rin), "0");
        assert.equal(String(query.where.rin), "17");
        assert.equal(
          query.include.producto_promocion.select.promocion.select.fecha_inicio,
          true,
        );
        assert.equal(
          query.include.producto_promocion.select.promocion.select.fecha_finalizacion,
          true,
        );
        return [
          makeProduct({ id_producto: 1, stock_bodega: [{ existencias: 0 }] }),
          makeProduct({
            id_producto: 2,
            stock_bodega: [{ existencias: 4 }],
            producto_promocion: [promotion({ descuento: 10 })],
          }),
        ];
      },
    },
  };
  const service = createSeoPublicService(database);
  const result = await service.getProductsBySize({
    width: "265",
    profile: "0.00",
    rim: "17.0",
    page: 1,
    pageSize: 1,
  });
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.totalPages, 2);
  assert.equal(result.products[0].id, "2");
  assert.equal(result.products[0].price, 3960);
});

test("vehicle landing includes only products linked to the requested version", async () => {
  const database = {
    modelo: {
      findMany: async () => [{
        id_modelo: 3,
        marca: "Toyota",
        nombre: "Hilux",
        anio: new Date("2023-01-01T00:00:00.000Z"),
        versiones: [{ id_version: 8, nombre: "SRV", activo: true }],
        modelo_producto: [
          {
            id_producto: 12,
            id_version: 8,
            producto: { estado: true },
            version: { id_version: 8, nombre: "SRV", activo: true },
          },
          {
            id_producto: 13,
            id_version: null,
            producto: { estado: true },
            version: null,
          },
        ],
      }],
    },
    producto: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.id_producto.in, [12]);
        return [makeProduct({
          id_producto: 12,
          producto_promocion: [
            promotion({
              descuento: 10,
              tipo_descuento: "monto",
              precio_promocion: 3500,
            }),
          ],
        })];
      },
    },
  };
  const service = createSeoPublicService(database);
  const result = await service.getVehicleProducts({
    brand: "toyota",
    model: "hilux",
    year: "2023",
    version: "srv",
  });
  assert.deepEqual(result.vehicle, {
    brand: "Toyota",
    model: "Hilux",
    year: 2023,
    version: "SRV",
  });
  assert.deepEqual(result.products.map(({ id }) => id), ["12"]);
  assert.equal(result.products[0].price, 3500);
});

test("catalog uses the same active promotional public price semantics", async () => {
  const service = createSeoPublicService({
    producto: {
      findMany: async ({ include }) => {
        assert.equal(include.producto_promocion.select.promocion.select.fecha_inicio, true);
        assert.equal(include.producto_promocion.select.promocion.select.fecha_finalizacion, true);
        return [
          makeProduct({
            id_producto: 20,
            producto_promocion: [
              promotion({
                descuento: 10,
                tipo_descuento: "monto",
                precio_promocion: 3500,
              }),
            ],
            modelo_producto: [],
          }),
        ];
      },
    },
  });
  const result = await service.getCatalog();
  assert.equal(result.products[0].price, 3500);
});

test("vehicle without real public product associations returns 404", async () => {
  const service = createSeoPublicService({
    modelo: {
      findMany: async () => [{
        id_modelo: 4,
        marca: "Toyota",
        nombre: "Hilux",
        anio: new Date("2023-01-01T00:00:00.000Z"),
        versiones: [],
        modelo_producto: [],
      }],
    },
  });
  await assert.rejects(
    service.getVehicleProducts({
      brand: "toyota",
      model: "hilux",
      year: "2023",
    }),
    (error) => error.status === 404,
  );
});

test("business SEO projection omits GPS attendance settings and RTN", async () => {
  const service = createSeoPublicService({
    sucursal: {
      findMany: async () => [{
        id_sucursal: 1,
        nombre: "Sucursal Centro",
        direccion: "Avenida Principal",
        lat: 15.5,
        lng: -87.9,
        RTN: "private",
        attendance_radius_m: 75,
        municipio: {
          nombre: "San Pedro Sula",
          departamento: { nombre_departamento: "Cortés" },
        },
      }],
    },
  });
  const result = await service.getBusinessLocations();
  assert.deepEqual(result.branches, [{
    id: "1",
    name: "Sucursal Centro",
    address: "Avenida Principal",
    municipality: "San Pedro Sula",
    department: "Cortés",
    latitude: 15.5,
    longitude: -87.9,
  }]);
});
