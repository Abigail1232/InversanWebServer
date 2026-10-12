const prisma = require("../config/database");
const { Prisma } = require("@prisma/client");

function publicProductInclude(now = new Date()) {
  return {
    marca: { select: { nombre: true } },
    diseno: { select: { nombre: true } },
    producto_imagen: {
      select: { imagen_url: true, orden: true },
      orderBy: { orden: "asc" },
    },
    stock_bodega: { select: { existencias: true } },
    producto_promocion: {
      where: {
        promocion: {
          fecha_inicio: { lte: now },
          fecha_finalizacion: { gte: now },
        },
      },
      select: {
        descuento: true,
        tipo_descuento: true,
        precio_promocion: true,
        promocion: {
          select: {
            titulo: true,
            fecha_inicio: true,
            fecha_finalizacion: true,
            mostrar_precio_porcentaje: true,
            mostrar_precio_tachado: true,
          },
        },
      },
    },
  };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function slugValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productPublicFields(product, now = new Date()) {
  const detailPrice = toNumber(product.precio_detalle);
  const activePromotion = (product.producto_promocion ?? [])
    .filter((item) => {
      const start = new Date(item.promocion?.fecha_inicio ?? 0);
      const end = new Date(item.promocion?.fecha_finalizacion ?? 0);
      return Number(item.descuento) > 0 && start <= now && end >= now;
    })
    .sort((left, right) => Number(right.descuento) - Number(left.descuento))[0];

  let price = detailPrice;
  let originalPrice;
  let discountPercent;
  let promotionDisplayMode;
  if (activePromotion && detailPrice !== null) {
    discountPercent = Number(activePromotion.descuento);
    originalPrice = detailPrice;
    price =
      activePromotion.tipo_descuento === "monto" &&
      activePromotion.precio_promocion != null
        ? toNumber(activePromotion.precio_promocion)
        : Math.round(
            detailPrice * (1 - discountPercent / 100) * 100,
          ) / 100;
    promotionDisplayMode = activePromotion.promocion?.mostrar_precio_porcentaje
      ? "porcentaje"
      : "precio_tachado";
  }

  return {
    id: String(product.id_producto),
    brand: product.marca?.nombre ?? "",
    name: product.nombre ?? "",
    design: product.diseno?.nombre ?? "",
    width: product.ancho_rin == null ? "" : String(product.ancho_rin),
    profile: product.alto_rin == null ? "" : String(product.alto_rin),
    rim: product.rin == null ? "" : String(product.rin),
    price,
    originalPrice,
    discountPercent,
    promotionDisplayMode,
    imageUrl: product.producto_imagen?.[0]?.imagen_url ?? "",
    stock: (product.stock_bodega ?? []).reduce(
      (total, entry) => total + Number(entry.existencias ?? 0),
      0,
    ),
    description: product.descripcion ?? "",
  };
}

function getYearDateRange(year) {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

function createSeoPublicService(database = prisma) {
  return {
    async getProductsBySize({ width, profile, rim, page = 1, pageSize = 12 }) {
      const widthValue = Number(width);
      const profileValue = Number(profile ?? 0);
      const rimValue = Number(rim);
      const pageNumber = Number(page);
      const boundedPageSize = Math.min(Math.max(Number(pageSize) || 12, 1), 48);
      if (
        !Number.isFinite(widthValue) ||
        widthValue <= 0 ||
        !Number.isFinite(profileValue) ||
        profileValue < 0 ||
        !Number.isFinite(rimValue) ||
        rimValue <= 0 ||
        !Number.isInteger(pageNumber) ||
        pageNumber < 1
      ) {
        throw { status: 400, message: "La medida solicitada no es válida." };
      }

      const now = new Date();
      const records = await database.producto.findMany({
        where: {
          estado: true,
          ancho_rin: new Prisma.Decimal(String(width)),
          alto_rin: new Prisma.Decimal(String(profile ?? 0)),
          rin: new Prisma.Decimal(String(rim)),
        },
        include: publicProductInclude(now),
      });
      const products = records
        .map((product) => productPublicFields(product, now))
        .sort((left, right) => right.stock - left.stock || left.id.localeCompare(right.id));
      if (products.length === 0) {
        throw { status: 404, message: "No hay productos públicos para esta medida." };
      }

      const start = (pageNumber - 1) * boundedPageSize;
      if (start >= products.length) {
        throw { status: 404, message: "No hay productos en esta página." };
      }
      return {
        products: products.slice(start, start + boundedPageSize),
        pagination: {
          page: pageNumber,
          pageSize: boundedPageSize,
          total: products.length,
          totalPages: Math.ceil(products.length / boundedPageSize),
        },
      };
    },

    async getVehicleProducts({
      brand,
      model,
      year,
      version,
      page = 1,
      pageSize = 12,
    }) {
      const yearNumber = Number(year);
      const pageNumber = Number(page);
      const boundedPageSize = Math.min(Math.max(Number(pageSize) || 12, 1), 48);
      if (
        !slugValue(brand) ||
        !slugValue(model) ||
        !Number.isInteger(yearNumber) ||
        yearNumber < 1900 ||
        yearNumber > 2200 ||
        !Number.isInteger(pageNumber) ||
        pageNumber < 1
      ) {
        throw { status: 400, message: "El vehículo solicitado no es válido." };
      }

      const models = await database.modelo.findMany({
        where: { activo: true, anio: getYearDateRange(yearNumber) },
        select: {
          id_modelo: true,
          marca: true,
          nombre: true,
          anio: true,
          modelo_producto: {
            select: {
              id_producto: true,
              id_version: true,
              producto: { select: { estado: true } },
              version: {
                select: { id_version: true, nombre: true, activo: true },
              },
            },
          },
          versiones: { select: { id_version: true, nombre: true, activo: true } },
        },
      });

      const matchingModels = models.filter(
        (item) =>
          slugValue(item.marca) === slugValue(brand) &&
          slugValue(item.nombre) === slugValue(model),
      );
      if (matchingModels.length === 0) {
        throw { status: 404, message: "No hay productos públicos asociados a este vehículo." };
      }

      const normalizedVersion = version ? slugValue(version) : null;
      const productsById = new Map();
      let matchedVersion;
      for (const vehicle of matchingModels) {
        const activeVersions = (vehicle.versiones ?? []).filter(
          (item) => item.activo,
        );
        const vehicleVersion = normalizedVersion
          ? activeVersions.find((item) => slugValue(item.nombre) === normalizedVersion)
          : undefined;
        if (normalizedVersion && !vehicleVersion) continue;

        for (const association of vehicle.modelo_producto ?? []) {
          if (
            association.producto?.estado !== true ||
            (vehicleVersion &&
              association.id_version !== vehicleVersion.id_version)
          ) {
            continue;
          }
          productsById.set(association.id_producto, true);
        }
        if (vehicleVersion) matchedVersion = vehicleVersion;
      }

      const productIds = [...productsById.keys()];
      if (productIds.length === 0) {
        throw { status: 404, message: "No hay productos públicos asociados a este vehículo." };
      }

      const now = new Date();
      const productRecords = await database.producto.findMany({
        where: { id_producto: { in: productIds }, estado: true },
        include: publicProductInclude(now),
      });
      const products = productRecords
        .map((product) => productPublicFields(product, now))
        .sort((left, right) => right.stock - left.stock || left.id.localeCompare(right.id));
      const start = (pageNumber - 1) * boundedPageSize;
      if (start >= products.length) {
        throw { status: 404, message: "No hay productos en esta página." };
      }
      const firstModel = matchingModels[0];
      return {
        vehicle: {
          brand: firstModel.marca,
          model: firstModel.nombre,
          year: yearNumber,
          version: matchedVersion?.nombre ?? null,
        },
        products: products.slice(start, start + boundedPageSize),
        pagination: {
          page: pageNumber,
          pageSize: boundedPageSize,
          total: products.length,
          totalPages: Math.ceil(products.length / boundedPageSize),
        },
      };
    },

    async getCatalog() {
      const now = new Date();
      const records = await database.producto.findMany({
        where: { estado: true },
        include: {
          ...publicProductInclude(now),
          modelo_producto: {
            where: {
              modelo: { activo: true },
              producto: { estado: true },
            },
            select: {
              id_version: true,
              version: {
                select: { nombre: true, activo: true },
              },
              modelo: {
                select: {
                  marca: true,
                  nombre: true,
                  anio: true,
                },
              },
            },
          },
        },
        orderBy: { id_producto: "asc" },
      });

      return {
        products: records.map((product) => ({
          ...productPublicFields(product, now),
          vehicles: (product.modelo_producto ?? [])
            .filter((association) => association.modelo?.activo !== false)
            .map((association) => ({
              brand: association.modelo.marca,
              model: association.modelo.nombre,
              year: new Date(association.modelo.anio).getUTCFullYear(),
              version:
                association.version?.activo === false
                  ? null
                  : association.version?.nombre ?? null,
            })),
        })),
      };
    },

    async getBusinessLocations() {
      const branches = await database.sucursal.findMany({
        where: { activo: true },
        select: {
          id_sucursal: true,
          nombre: true,
          direccion: true,
          lat: true,
          lng: true,
          municipio: {
            select: {
              nombre: true,
              departamento: { select: { nombre_departamento: true } },
            },
          },
        },
      });

      return {
        branches: branches
          .filter((branch) => String(branch.direccion ?? "").trim())
          .map((branch) => ({
            id: String(branch.id_sucursal),
            name: branch.nombre,
            address: String(branch.direccion).trim(),
            municipality: branch.municipio?.nombre ?? "",
            department: branch.municipio?.departamento?.nombre_departamento ?? "",
            latitude:
              branch.lat != null &&
              Number.isFinite(Number(branch.lat)) &&
              Number(branch.lat) >= -90 &&
              Number(branch.lat) <= 90
                ? Number(branch.lat)
                : null,
            longitude:
              branch.lng != null &&
              Number.isFinite(Number(branch.lng)) &&
              Number(branch.lng) >= -180 &&
              Number(branch.lng) <= 180
                ? Number(branch.lng)
                : null,
          })),
      };
    },
  };
}

module.exports = {
  createSeoPublicService,
  productPublicFields,
  slugValue,
};
