import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildProductStructuredData,
  buildProductSeo,
  buildProductUrl,
  buildProductSlug,
  buildTireSizeSlug,
  buildTireSizeUrl,
  buildVehicleUrl,
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildTireShopStructuredData,
  extractProductIdFromSlug,
  formatProductMeasure,
  normalizeApiAssetUrlForBase,
  normalizeSeoSlugPart,
  parseTireSizeSlug,
  serializeForScript,
} from "../dist/server/entry-server.bundle.js";

const DEFAULT_SITE_URL =
  process.env.NODE_ENV === "production"
    ? "https://grupoinversan.com"
    : "http://localhost:5000";

const STATIC_CONTENT_TYPES = {
  ".css": "text/css",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const PRIVATE_PATHS = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/password-reset",
  "/reset-password",
  "/profile",
  "/cart",
  "/checkout",
  "/orders",
  "/pedido",
  "/notification",
  "/mi-asistencia",
  "/marcar-mi-asistencia",
  "/asistencia",
  "/reportes",
  "/delivery",
  "/search",
  "/suggestions",
  "/promotion",
  "/api",
  "/api/pedido",
];

const ROBOTS_TXT = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin/",
  "Disallow: /profile",
  "Disallow: /cart",
  "Disallow: /checkout",
  "Disallow: /orders",
  "Disallow: /pedido/",
  "Disallow: /notification",
  "Disallow: /login",
  "Disallow: /register",
  "Disallow: /forgot-password",
  "Disallow: /password-reset",
  "Disallow: /reset-password",
  "Disallow: /mi-asistencia",
  "Disallow: /marcar-mi-asistencia",
  "Disallow: /asistencia",
  "Disallow: /reportes",
  "Disallow: /delivery",
  "Disallow: /api/",
].join("\n");

function isNoindexPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return PRIVATE_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plainText(value) {
  return String(value ?? "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSitemapUrlList(catalog, siteUrl) {
  const urls = new Set([
    new URL("/", siteUrl).toString(),
    new URL("/contact", siteUrl).toString(),
  ]);
  const sizes = new Set();
  const vehicles = new Map();

  for (const product of catalog.products ?? []) {
    if (!product.id || !product.brand) continue;
    urls.add(new URL(buildProductUrl(product), siteUrl).toString());
    const sizeSlug = buildTireSizeSlug(
      product.width,
      product.profile,
      product.rim,
    );
    if (sizeSlug) sizes.add(sizeSlug);

    for (const vehicle of product.vehicles ?? []) {
      const year = Number(vehicle.year);
      if (
        !vehicle.brand ||
        !vehicle.model ||
        !Number.isInteger(year) ||
        year < 1900
      ) {
        continue;
      }
      const baseVehicle = {
        brand: vehicle.brand,
        model: vehicle.model,
        year,
      };
      const basePath = buildVehicleUrl(baseVehicle);
      const key = basePath.toLowerCase();
      if (!vehicles.has(key)) {
        vehicles.set(key, {
          baseVehicle,
          productIds: new Set(),
          versions: new Map(),
        });
      }
      const group = vehicles.get(key);
      group.productIds.add(String(product.id));
      if (vehicle.version) {
        const versionKey = normalizeSeoSlugPart(vehicle.version);
        if (!group.versions.has(versionKey)) {
          group.versions.set(versionKey, {
            name: vehicle.version,
            productIds: new Set(),
          });
        }
        group.versions.get(versionKey).productIds.add(String(product.id));
      }
    }
  }

  for (const sizeSlug of sizes) {
    urls.add(new URL(`/llantas/${sizeSlug}`, siteUrl).toString());
  }
  for (const group of vehicles.values()) {
    urls.add(new URL(buildVehicleUrl(group.baseVehicle), siteUrl).toString());
    for (const version of group.versions.values()) {
      const sameProducts =
        version.productIds.size === group.productIds.size &&
        [...version.productIds].every((id) => group.productIds.has(id));
      if (!sameProducts) {
        urls.add(
          new URL(
            buildVehicleUrl({ ...group.baseVehicle, version: version.name }),
            siteUrl,
          ).toString(),
        );
      }
    }
  }
  return [...urls];
}

export function buildSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((url) => `<url><loc>${escapeXml(url)}</loc></url>`)
    .join("")}</urlset>`;
}

export function buildSitemapIndexXml(siteUrl, sitemapCount) {
  const entries = Array.from({ length: sitemapCount }, (_, index) => {
    const location = new URL(`/sitemap-${index + 1}.xml`, siteUrl).toString();
    return `<sitemap><loc>${escapeXml(location)}</loc></sitemap>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function buildMerchantFeed(catalog, siteUrl, apiBase) {
  const items = (catalog.products ?? [])
    .flatMap((product) => {
      const price = Number(product.price);
      if (!product.id || !Number.isFinite(price) || price <= 0) return [];
      if (!plainText(product.brand)) return [];
      const productUrl = new URL(buildProductUrl(product), siteUrl).toString();
      const seo = buildProductSeo(product);
      const title = plainText(seo.heading);
      const description = plainText(product.description) || seo.description;
      const rawImage =
        typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
      if (/^http:\/\//i.test(rawImage)) return [];
      const image =
        /^https:\/\//i.test(rawImage)
          ? rawImage
          : normalizeApiAssetUrlForBase(
              rawImage,
              process.env.PUBLIC_API_URL ?? process.env.VITE_API_URL ?? apiBase,
              "public",
              true,
            );
      let safeImage = "";
      try {
        const parsedImage = new URL(image);
        if (
          parsedImage.protocol === "https:" &&
          !parsedImage.username &&
          !parsedImage.password
        ) {
          safeImage = parsedImage.toString();
        }
      } catch {
        safeImage = "";
      }
      if (!title || !plainText(description) || !safeImage) return [];
      const availability =
        Number(product.stock) > 0 ? "in_stock" : "out_of_stock";
      const fields = [
        ["g:id", product.id],
        ["g:title", title],
        ["g:description", description],
        ["g:link", productUrl],
        ["g:image_link", safeImage],
        ["g:availability", availability],
        ["g:price", `${price.toFixed(2)} HNL`],
        ...(product.brand ? [["g:brand", product.brand]] : []),
      ];
      return [`<item>${fields
        .map(([tag, value]) => `<${tag}>${escapeXml(value)}</${tag}>`)
        .join("")}</item>`];
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Inversan</title><link>${escapeXml(siteUrl)}</link><description>Productos públicos de llantas disponibles en Inversan Honduras.</description>${items}</channel></rss>`;
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

function publicProduct(apiProduct, apiBase) {
  const specs = apiProduct.especificaciones ?? {};
  const stock = Number(apiProduct.stock_total);
  const images = (apiProduct.imagenes ?? []).map((image) => ({
    id: String(image.id),
    url: String(image.url ?? ""),
    alt: `${apiProduct.nombre ?? "Llanta"} - ${image.orden ?? ""}`,
  }));
  const detailPrice = Number(apiProduct.precios?.detalle);
  if (!Number.isFinite(stock) || apiProduct.stock_total == null) {
    throw new Error("La API respondió con una disponibilidad inválida.");
  }
  if (!Number.isFinite(detailPrice) || apiProduct.precios?.detalle == null) {
    throw new Error("La API respondió con un precio inválido.");
  }
  const activePromotion = (apiProduct.promociones ?? [])
    .filter((promotion) => {
      const start = new Date(promotion.promocion?.fecha_inicio ?? 0);
      const end = new Date(promotion.promocion?.fecha_finalizacion ?? 0);
      return promotion.descuento > 0 && start <= new Date() && end >= new Date();
    })
    .sort((left, right) => right.descuento - left.descuento)[0];

  let price = detailPrice;
  let originalPrice;
  let discountPercent;
  let promotionDisplayMode;
  let promotionText;
  if (activePromotion) {
    discountPercent = Number(activePromotion.descuento);
    originalPrice = detailPrice;
    promotionDisplayMode = activePromotion.promocion?.mostrar_precio_porcentaje
      ? "porcentaje"
      : "precio_tachado";
    price =
      activePromotion.tipo_descuento === "monto" &&
      activePromotion.precio_promocion
        ? Number(activePromotion.precio_promocion)
        : detailPrice * (1 - discountPercent / 100);
    promotionText = activePromotion.promocion?.titulo ?? undefined;
  }

  const product = {
    id: String(apiProduct.id_producto),
    brand: apiProduct.marca ?? "",
    company: "",
    name: apiProduct.nombre ?? "",
    design: apiProduct.diseno?.nombre ?? "",
    category: apiProduct.categoria ?? "",
    price,
    originalPrice,
    discountPercent,
    promotionDisplayMode,
    promotionText,
    includesVat: true,
    specs: [
      { label: "Alto", value: String(specs.ancho_rin ?? "N/A") },
      {
        label: "Perfil",
        value:
          String(specs.alto_rin ?? "N/A") === "0"
            ? "Sin perfil"
            : String(specs.alto_rin ?? "N/A"),
      },
      { label: "Lona", value: String(specs.lonas ?? "N/A") },
      { label: "Rin", value: String(specs.rin ?? "N/A") },
      {
        label: "Índice de carga",
        value: String(specs.indice_de_carga ?? "N/A"),
      },
      {
        label: "Índice de velocidad",
        value: String(specs.indice_velocidad ?? "N/A"),
      },
      {
        label: "Presión Máxima",
        value: String(specs.presion_maxima ?? "N/A"),
      },
      { label: "Profundidad", value: String(specs.profundidad ?? "N/A") },
    ],
    stock,
    images,
    description: apiProduct.descripcion ?? "",
    descriptionFeatures: [],
    relatedProducts: [],
    relatedSpecsSections: [],
    hasWholesalePrice: Number(apiProduct.precios?.mayoreo) < detailPrice,
    model3DUrl: apiProduct.imagen_3d ?? undefined,
    imageUrl: images[0]
      ? normalizeApiAssetUrlForBase(
          images[0].url,
          process.env.PUBLIC_API_URL ?? process.env.VITE_API_URL ?? apiBase,
          "public",
          true,
        )
      : "",
  };

  return product;
}

function buildMetadataDocument(template, content, options) {
  const {
    title,
    description,
    canonicalPath,
    siteUrl,
    robots = "index,follow",
    openGraphType = "website",
    image,
    product,
    structuredData = [],
    breadcrumbs,
    branches = [],
    statusCode = 200,
    hydration = "",
    hydrate = false,
  } = options;
  const productSeoMarker = product ? ' data-inversan-product-seo="true"' : "";
  const canonical = canonicalPath
    ? new URL(canonicalPath, siteUrl).toString()
    : null;
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}"${productSeoMarker}>`,
    `<meta name="robots" content="${escapeHtml(robots)}">`,
    canonical
      ? `<link rel="canonical" href="${escapeHtml(canonical)}"${productSeoMarker}>`
      : "",
    `<meta property="og:type" content="${escapeHtml(openGraphType)}"${productSeoMarker}>`,
    `<meta property="og:title" content="${escapeHtml(title)}"${productSeoMarker}>`,
    `<meta property="og:description" content="${escapeHtml(description)}"${productSeoMarker}>`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}"${productSeoMarker}>` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}"${productSeoMarker}>` : "",
    `<meta name="twitter:card" content="summary_large_image"${productSeoMarker}>`,
    `<meta name="twitter:title" content="${escapeHtml(title)}"${productSeoMarker}>`,
    `<meta name="twitter:description" content="${escapeHtml(description)}"${productSeoMarker}>`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}"${productSeoMarker}>` : "",
    process.env.GOOGLE_SITE_VERIFICATION?.trim()
      ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION.trim())}">`
      : "",
    `<script type="application/ld+json" data-inversan-global-jsonld="true">${serializeForScript(buildOrganizationStructuredData(siteUrl))}</script>`,
    ...buildTireShopStructuredData(branches, siteUrl).map(
      (branch) =>
        `<script type="application/ld+json" data-inversan-branch-jsonld="true">${serializeForScript(branch)}</script>`,
    ),
    ...structuredData.map(
      ({ data, marker }) =>
        `<script type="application/ld+json" data-${marker}="true">${serializeForScript(data)}</script>`,
    ),
    breadcrumbs
      ? `<script type="application/ld+json" data-inversan-client-breadcrumbs="true">${serializeForScript(buildBreadcrumbStructuredData(breadcrumbs, siteUrl))}</script>`
      : "",
    product
      ? `<script>window.__INITIAL_PRODUCT__=${serializeForScript(product)};window.__INITIAL_SSR_PAGE__=true;</script>`
      : hydrate
        ? `<script>window.__INITIAL_SSR_PAGE__=true;${hydration}</script>`
        : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  const document = template
    .replace(/<html\b[^>]*>/i, '<html lang="es-HN">')
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace("</head>", `    ${metadata}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);

  return { statusCode, body: document };
}

function htmlDocument(
  template,
  content,
  seo,
  product,
  siteUrl,
  apiBase,
  statusCode = 200,
) {
  const structuredData = buildProductStructuredData(product, {
    siteUrl,
    apiBaseUrl:
      process.env.PUBLIC_API_URL ?? process.env.VITE_API_URL ?? apiBase,
    isTireProduct: true,
  });
  return buildMetadataDocument(template, content, {
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    siteUrl,
    openGraphType: "product",
    image: product.imageUrl,
    product,
    structuredData: [
      {
        data: structuredData,
        marker: "inversan-product-jsonld",
      },
    ],
    breadcrumbs: [
      { name: "Inicio", path: "/" },
      ...(seo.measure
        ? [{ name: `Llantas ${seo.measure}`, path: buildTireSizeUrlFromProduct(product) }]
        : []),
      { name: seo.heading ?? seo.title, path: seo.canonicalPath },
    ],
    statusCode,
  });
}

function buildTireSizeUrlFromProduct(product) {
  const specs = new Map(
    (product.specs ?? []).map((spec) => [spec.label.toLowerCase(), spec.value]),
  );
  return buildTireSizeUrl(
    specs.get("alto"),
    specs.get("perfil"),
    specs.get("rin"),
  );
}

function errorDocument(
  template,
  { statusCode, title, message, siteUrl = DEFAULT_SITE_URL },
) {
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    '<meta name="robots" content="noindex">',
    process.env.GOOGLE_SITE_VERIFICATION?.trim()
      ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION.trim())}">`
      : "",
    `<script type="application/ld+json" data-inversan-global-jsonld="true">${serializeForScript(buildOrganizationStructuredData(siteUrl))}</script>`,
  ].join("\n    ");
  return {
    statusCode,
    body: template
      .replace(/<html\b[^>]*>/i, '<html lang="es-HN">')
      .replace(/<title>[\s\S]*?<\/title>/i, "")
      .replace("</head>", `    ${metadata}\n  </head>`)
      .replace(/<script\b[^>]*type="module"[^>]*><\/script>/gi, "")
      .replace(
        '<div id="root"></div>',
        `<main id="root"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main>`,
      ),
  };
}

export function createSsrServer({
  distDirectory = path.resolve(process.cwd(), "dist"),
  apiBase =
    process.env.SSR_API_URL ??
    process.env.VITE_API_URL ??
    "http://localhost:3000",
  siteUrl = process.env.PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  fetchImpl = fetch,
  renderProduct = async () => {
    throw new Error("El renderer SSR de producto no está disponible.");
  },
  renderTireSize = async () => {
    throw new Error("El renderer SSR de medida no está disponible.");
  },
  renderVehicle = async () => {
    throw new Error("El renderer SSR de vehículo no está disponible.");
  },
  renderHome = async () => {
    throw new Error("El renderer SSR de inicio no está disponible.");
  },
  renderRoute = async () => "",
} = {}) {
  const apiCache = new Map();
  const cacheDurationMs = 300_000;

  async function fetchSeoJson(endpoint) {
    const response = await fetchImpl(
      `${apiBase.replace(/\/+$/, "")}/api/seo/${endpoint}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`La API SEO respondió HTTP ${response.status}.`);
    }
    return response.json();
  }

  async function getCachedSeoJson(endpoint, ttlMs = cacheDurationMs) {
    const cached = apiCache.get(endpoint);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const value = await fetchSeoJson(endpoint);
    if (value !== null) {
      apiCache.set(endpoint, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    }
    return value;
  }

  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const { pathname } = requestUrl;
    const method = request.method ?? "GET";
    const headOnly = method === "HEAD";
    const send = (statusCode, headers, body = "") => {
      response.writeHead(statusCode, headers);
      response.end(headOnly ? "" : body);
    };

    const legacyProduct = requestUrl.pathname.match(/^\/product\/([^/]+)\/?$/);

    try {
      if (method !== "GET" && method !== "HEAD") {
        send(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" }, "Method not allowed.");
        return;
      }

      if (pathname === "/robots.txt") {
        const body = `${ROBOTS_TXT}\nSitemap: ${new URL("/sitemap.xml", siteUrl)}\n`;
        send(200, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        }, body);
        return;
      }

      if (pathname === "/sitemap.xml" || /^\/sitemap-\d+\.xml$/.test(pathname)) {
        const catalog = await getCachedSeoJson("catalog");
        if (!catalog || !Array.isArray(catalog.products)) {
          throw new Error("La API SEO respondió con un catálogo inválido.");
        }
        const urls = buildSitemapUrlList(catalog, siteUrl);
        const pageCount = Math.ceil(urls.length / 50000);
        let sitemap;
        if (pageCount > 1) {
          if (pathname === "/sitemap.xml") {
            sitemap = buildSitemapIndexXml(siteUrl, pageCount);
          } else {
            const match = pathname.match(/^\/sitemap-(\d+)\.xml$/);
            const pageNumber = Number(match?.[1]);
            if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
              send(404, { "Content-Type": "text/plain; charset=utf-8" }, "Sitemap not found.");
              return;
            }
            const start = (pageNumber - 1) * 50000;
            sitemap = buildSitemapXml(urls.slice(start, start + 50000));
          }
        } else if (pathname === "/sitemap.xml") {
          sitemap = buildSitemapXml(urls);
        } else {
          send(404, { "Content-Type": "text/plain; charset=utf-8" }, "Sitemap not found.");
          return;
        }
        send(200, {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        }, sitemap);
        return;
      }

      if (pathname === "/google-merchant.xml" || pathname === "/merchant-feed.xml") {
        const catalog = await getCachedSeoJson("catalog");
        if (!catalog || !Array.isArray(catalog.products)) {
          throw new Error("La API SEO respondió con un catálogo inválido.");
        }
        send(200, {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        }, buildMerchantFeed(catalog, siteUrl, apiBase));
        return;
      }

      if (pathname === "/" || pathname === "/home" || pathname === "/home/") {
        if (pathname !== "/") {
          response.writeHead(301, {
            Location: new URL("/", siteUrl).toString(),
            "Cache-Control": "no-store",
          });
          response.end();
          return;
        }
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        const [locationData] = await Promise.all([
          getCachedSeoJson("business-locations"),
        ]);
        if (!Array.isArray(locationData?.branches)) {
          throw new Error("La API SEO respondió sin sucursales públicas.");
        }
        const content = await renderHome();
        const page = buildMetadataDocument(template, content, {
          title: "Llantas en Honduras para Carro, SUV y Pickup | Inversan",
          description: "Encuentra llantas para carro, SUV y pickup en Inversan Honduras. Consulta medidas, marcas, precios y disponibilidad.",
          canonicalPath: "/",
          siteUrl,
          branches: locationData.branches,
          hydrate: true,
        });
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        }, page.body);
        return;
      }

      const sizeRoute = pathname.match(/^\/llantas\/([^/]+)\/?$/);
      if (sizeRoute) {
        const requestedSlug = decodeURIComponent(sizeRoute[1]);
        const size = parseTireSizeSlug(requestedSlug);
        if (size) {
          const canonicalSlug = buildTireSizeSlug(
            size.width,
            size.profile,
            size.rim,
          );
          const canonicalPath = buildTireSizeUrl(
            size.width,
            size.profile,
            size.rim,
          );
          const rawPage = requestUrl.searchParams.get("pagina");
          const pageNumber = rawPage === null ? 1 : Number(rawPage);
          if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            (rawPage !== null && !/^[1-9]\d*$/.test(rawPage))
          ) {
            const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
            const page = errorDocument(template, {
              statusCode: 404,
              title: "Medida no encontrada | Inversan",
              message: "No encontramos la página de medida solicitada.",
              siteUrl,
            });
            send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
            return;
          }
          const extraQuery = [...requestUrl.searchParams.keys()].some(
            (key) => key !== "pagina",
          );
          if (
            requestedSlug !== canonicalSlug ||
            pathname.endsWith("/") ||
            extraQuery ||
            rawPage === "1"
          ) {
            const target = new URL(canonicalPath, siteUrl);
            if (pageNumber > 1) target.searchParams.set("pagina", String(pageNumber));
            response.writeHead(301, {
              Location: target.toString(),
              "Cache-Control": "no-store",
            });
            response.end();
            return;
          }
          const query = new URLSearchParams({
            width: size.width,
            profile: size.profile,
            rim: size.rim,
            page: String(pageNumber),
            pageSize: "12",
          });
          const data = await getCachedSeoJson(
            `tire-size?${query.toString()}`,
            60000,
          );
          const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
          if (
            !data ||
            !Array.isArray(data.products) ||
            data.products.length === 0 ||
            !data.pagination
          ) {
            const page = errorDocument(template, {
              statusCode: 404,
              title: "Medida no encontrada | Inversan",
              message: "No encontramos productos públicos para esta medida.",
              siteUrl,
            });
            send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
            return;
          }
          const measure = formatProductMeasure(
            size.width,
            size.profile,
            size.rim,
          );
          const currentCanonical =
            pageNumber > 1
              ? `${canonicalPath}?pagina=${pageNumber}`
              : canonicalPath;
          const content = await renderTireSize(
            `${pathname}${requestUrl.search}`,
            data,
          );
          const page = buildMetadataDocument(template, content, {
            title: `Llantas ${measure} en Honduras | Inversan`,
            description: `Compra llantas ${measure} en Honduras. Compara marcas, precios y disponibilidad en Inversan.`,
            canonicalPath: currentCanonical,
            siteUrl,
            breadcrumbs: [
              { name: "Inicio", path: "/" },
              { name: `Llantas ${measure}`, path: canonicalPath },
            ],
            hydration: `window.__INITIAL_TIRE_SIZE__=${serializeForScript(data)};`,
            hydrate: true,
          });
          send(page.statusCode, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          }, page.body);
          return;
        }
      }

      const vehicleRoute = pathname.match(
        /^\/llantas\/vehiculo\/([^/]+)\/([^/]+)\/(\d{4})(?:\/([^/]+))?\/?$/,
      );
      if (pathname.startsWith("/llantas/vehiculo/")) {
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        if (!vehicleRoute) {
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Vehículo no encontrado | Inversan",
            message: "No encontramos productos públicos asociados a este vehículo.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }
        const [, brand, model, year, version] = vehicleRoute;
        const rawPage = requestUrl.searchParams.get("pagina");
        const pageNumber = rawPage === null ? 1 : Number(rawPage);
        if (
          !Number.isInteger(pageNumber) ||
          pageNumber < 1 ||
          (rawPage !== null && !/^[1-9]\d*$/.test(rawPage))
        ) {
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Vehículo no encontrado | Inversan",
            message: "No encontramos la página solicitada.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }
        const vehicleQuery = new URLSearchParams({
          brand,
          model,
          year,
          page: String(pageNumber),
          pageSize: "12",
        });
        if (version) vehicleQuery.set("version", version);
        const data = await getCachedSeoJson(
          `vehicle?${vehicleQuery.toString()}`,
          60000,
        );
        if (
          !data ||
          !Array.isArray(data.products) ||
          data.products.length === 0 ||
          !data.pagination
        ) {
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Vehículo no encontrado | Inversan",
            message: "No encontramos productos públicos asociados a este vehículo.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }
        const canonicalPath = buildVehicleUrl({
          brand: data.vehicle.brand,
          model: data.vehicle.model,
          year: data.vehicle.year,
          version: data.vehicle.version,
        });
        const extraQuery = [...requestUrl.searchParams.keys()].some(
          (key) => key !== "pagina",
        );
        if (
          pathname !== canonicalPath ||
          pathname.endsWith("/") ||
          extraQuery ||
          rawPage === "1"
        ) {
          const target = new URL(canonicalPath, siteUrl);
          if (pageNumber > 1) target.searchParams.set("pagina", String(pageNumber));
          response.writeHead(301, {
            Location: target.toString(),
            "Cache-Control": "no-store",
          });
          response.end();
          return;
        }
        const title = `Llantas para ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year}${data.vehicle.version ? ` ${data.vehicle.version}` : ""} | Inversan Honduras`;
        const description = `Encuentra llantas registradas como compatibles con ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year} en el catálogo de Inversan. Consulta marcas, medidas, precios y disponibilidad.`;
        const currentCanonical =
          pageNumber > 1
            ? `${canonicalPath}?pagina=${pageNumber}`
            : canonicalPath;
        const content = await renderVehicle(
          `${pathname}${requestUrl.search}`,
          data,
        );
        const page = buildMetadataDocument(template, content, {
          title,
          description,
          canonicalPath: currentCanonical,
          siteUrl,
          breadcrumbs: [
            { name: "Inicio", path: "/" },
            {
              name: `${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year}`,
              path: canonicalPath,
            },
          ],
          hydration: `window.__INITIAL_VEHICLE__=${serializeForScript(data)};`,
          hydrate: true,
        });
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        }, page.body);
        return;
      }

      const routeMatch =
        pathname.match(/^\/llantas\/([^/]+)\/?$/) ??
        pathname.match(/^\/product\/([^/]+)\/?$/);
      if (routeMatch) {
        const requestedSlug = legacyProduct
          ? null
          : decodeURIComponent(routeMatch[1]);
        const productId = legacyProduct
          ? (/^\d+$/.test(routeMatch[1]) ? routeMatch[1] : null)
          : extractProductIdFromSlug(requestedSlug);
        if (
          !productId ||
          !Number.isSafeInteger(Number(productId)) ||
          Number(productId) <= 0
        ) {
          const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Producto no encontrado | Inversan",
            message: "No encontramos el producto solicitado.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }

        const apiResponse = await fetchImpl(
          `${apiBase.replace(/\/+$/, "")}/api/products/${encodeURIComponent(productId)}`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(10000),
          },
        );
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        if (apiResponse.status === 404) {
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Producto no encontrado | Inversan",
            message: "No encontramos el producto solicitado.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }
        if (!apiResponse.ok) {
          throw new Error(`La API de productos respondió HTTP ${apiResponse.status}.`);
        }

        const payload = await apiResponse.json();
        if (!payload.producto) {
          throw new Error("La API respondió sin los datos esperados del producto.");
        }
        if (payload.producto.estado === false) {
          const page = errorDocument(template, {
            statusCode: 404,
            title: "Producto no encontrado | Inversan",
            message: "No encontramos el producto solicitado.",
            siteUrl,
          });
          send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
          return;
        }
        const product = publicProduct(payload.producto, apiBase);
        const seoProduct = { ...product, design: product.design || product.name };
        const seo = buildProductSeo(seoProduct);
        const canonicalUrl = new URL(seo.canonicalPath, siteUrl).toString();
        if (
          legacyProduct ||
          requestUrl.pathname.endsWith("/") ||
          requestedSlug !== buildProductSlug(seoProduct)
        ) {
          response.writeHead(301, { Location: canonicalUrl, "Cache-Control": "no-store" });
          response.end();
          return;
        }

        const content = renderProduct(requestUrl.pathname, product);
        const page = htmlDocument(template, content, seo, product, siteUrl, apiBase);
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }, page.body);
        return;
      }

      if (pathname === "/contact" || pathname === "/contact/") {
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        const locationData = await getCachedSeoJson("business-locations");
        if (!Array.isArray(locationData?.branches)) {
          throw new Error("La API SEO respondió sin sucursales públicas.");
        }
        const content = await renderRoute("/contact");
        const page = buildMetadataDocument(template, content, {
          title: "Contacto y sucursales | Inversan Honduras",
          description: "Consulta las ubicaciones de las sucursales de Inversan en Honduras.",
          canonicalPath: "/contact",
          siteUrl,
          branches: locationData.branches,
          hydrate: true,
        });
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        }, page.body);
        return;
      }

      const brandRoute = pathname.match(/^\/brand\/[^/]+\/?$/);
      if (brandRoute) {
        const canonicalPath = pathname.replace(/\/+$/, "");
        if (pathname !== canonicalPath) {
          const target = new URL(canonicalPath, siteUrl);
          target.search = requestUrl.search;
          response.writeHead(301, {
            Location: target.toString(),
            "Cache-Control": "no-store",
          });
          response.end();
          return;
        }
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        const content = await renderRoute(`${pathname}${requestUrl.search}`);
        const page = buildMetadataDocument(template, content, {
          title: "Llantas por marca | Inversan Honduras",
          description: "Explora las llantas de las marcas disponibles en Inversan Honduras.",
          canonicalPath,
          siteUrl,
          robots: "noindex,follow",
          hydrate: true,
        });
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        }, page.body);
        return;
      }

      const safePath = path.resolve(distDirectory, `.${decodeURIComponent(pathname)}`);
      const root = path.resolve(distDirectory);
      if (safePath.startsWith(`${root}${path.sep}`) || safePath === root) {
        try {
          const fileStat = await stat(safePath);
          if (fileStat.isFile()) {
            const asset = await readFile(safePath);
            const contentType =
              STATIC_CONTENT_TYPES[path.extname(safePath).toLowerCase()] ??
              "application/octet-stream";
            send(200, { "Content-Type": contentType }, asset);
            return;
          }
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
      }

      const shell = await readFile(path.join(distDirectory, "index.html"), "utf8");
      if (isNoindexPath(pathname)) {
        const noindexShell = buildMetadataDocument(shell, "", {
          title: "Inversan",
          description: "Inversan Honduras.",
          siteUrl,
          robots: "noindex,nofollow",
        });
        send(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        }, noindexShell.body);
        return;
      }
      if (pathname.startsWith("/llantas/")) {
        const page = errorDocument(shell, {
          statusCode: 404,
          title: "Página no encontrada | Inversan",
          message: "No encontramos la página solicitada.",
          siteUrl,
        });
        send(page.statusCode, {
          "Content-Type": "text/html; charset=utf-8",
        }, page.body);
        return;
      }
      const shellPage = buildMetadataDocument(shell, "", {
        title: "Inversan | Llantas en Honduras",
        description: "Encuentra llantas para carro, SUV y pickup en Inversan Honduras.",
        canonicalPath: pathname,
        siteUrl,
        robots: "noindex,nofollow",
      });
      send(404, {
        "Content-Type": "text/html; charset=utf-8",
      }, shellPage.body);
    } catch (error) {
      console.error("Error atendiendo página SSR:", error);
      try {
        const template = await readFile(path.join(distDirectory, "index.html"), "utf8");
        if (
          pathname === "/robots.txt" ||
          pathname.startsWith("/sitemap") ||
          pathname.endsWith("merchant.xml")
        ) {
          send(500, { "Content-Type": "text/plain; charset=utf-8" }, "No fue posible generar el recurso SEO.");
          return;
        }
        const page = errorDocument(template, {
          statusCode: 500,
          title: "Error interno | Inversan",
          message: "No fue posible cargar el producto.",
          siteUrl,
        });
        send(page.statusCode, { "Content-Type": "text/html; charset=utf-8" }, page.body);
      } catch (templateError) {
        console.error("No fue posible cargar el documento de error SSR:", templateError);
        send(500, { "Content-Type": "text/plain; charset=utf-8" }, "Error interno del servidor.");
      }
    }
  });
}

async function start() {
  const rendererUrl = pathToFileURL(
    path.resolve(process.cwd(), "dist/server/entry-server.bundle.js"),
  );
  const renderer = await import(rendererUrl.href);
  const server = createSsrServer({
    renderProduct: renderer.renderProductPage,
    renderTireSize: renderer.renderTireSizePage,
    renderVehicle: renderer.renderVehiclePage,
    renderHome: renderer.renderHomePage,
    renderRoute: renderer.renderRoutePage,
  });
  const port = Number(process.env.PORT ?? 5000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Frontend SSR activo en el puerto ${port}`);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void start();
}
