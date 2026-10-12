import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductSeo,
  buildProductSlug,
  buildProductUrl,
  buildTireSizeSlug,
  buildTireSizeUrl,
  buildVehicleSlug,
  buildVehicleUrl,
  extractProductIdFromSlug,
  formatProductMeasure,
  getCanonicalProductRedirect,
  parseTireSizeSlug,
} from "../src/seo/productSeo.ts";
import {
  buildProductStructuredData,
  serializeForScript,
} from "../src/seo/productStructuredData.ts";
import { normalizeApiAssetUrlForBase } from "../src/config/assetUrlCore.ts";
import {
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildTireShopStructuredData,
} from "../src/seo/globalStructuredData.ts";

const product = {
  id: "123",
  brand: "RoadX",
  name: "RXMotion",
  specs: [
    { label: "Alto", value: "265" },
    { label: "Perfil", value: "65" },
    { label: "Rin", value: "17" },
  ],
  price: 4400,
  stock: 3,
  imageUrl: "",
};

test("builds the canonical product slug from brand, size, design, and ID", () => {
  const relatedProduct = {
    id: "123",
    brand: "RoadX",
    name: "RXMotion",
    design: "RXMotion",
    width: 265,
    profile: 65,
    rim: 17,
    price: 4400,
    stock: 3,
    imageUrl: "",
  };
  assert.equal(buildProductSlug(product), "roadx-265-65-r17-rxmotion-123");
  assert.equal(
    buildProductSlug(relatedProduct),
    "roadx-265-65-r17-rxmotion-123",
  );
  assert.equal(buildProductSlug(product), buildProductSlug(relatedProduct));
  assert.equal(
    buildProductUrl(product),
    "/llantas/roadx-265-65-r17-rxmotion-123",
  );
  assert.equal(
    buildProductUrl(relatedProduct),
    "/llantas/roadx-265-65-r17-rxmotion-123",
  );
  assert.equal(
    buildProductUrl({ ...relatedProduct, stock: 0 }),
    "/llantas/roadx-265-65-r17-rxmotion-123",
  );
  assert.equal(
    buildProductSeo({ ...product, name: "SKU", design: "RXMotion" }).heading,
    "Llanta RoadX 265/65R17 RXMotion",
  );
});

test("normalizes accents and special characters", () => {
  assert.equal(
    buildProductSlug({
      ...product,
      brand: "MICHELÍN",
      name: "Primacy 4+",
    }),
    "michelin-265-65-r17-primacy-4-123",
  );
});

test("creates a valid slug when the design is missing", () => {
  assert.equal(
    buildProductSlug({ ...product, name: "" }),
    "roadx-265-65-r17-123",
  );
});

test("normalizes profile zero as no profile for products and related products", () => {
  const noProfileProduct = {
    ...product,
    specs: [
      { label: "Alto", value: "265" },
      { label: "Perfil", value: "Sin perfil" },
      { label: "Rin", value: "17" },
    ],
  };
  const noProfileRelated = {
    id: "123",
    brand: "RoadX",
    name: "RXMotion",
    design: "RXMotion",
    width: 265,
    profile: 0,
    rim: 17,
    price: 4400,
    stock: 3,
    imageUrl: "",
  };

  assert.equal(buildProductSlug(noProfileProduct), "roadx-265-r17-rxmotion-123");
  assert.equal(buildProductSlug(noProfileRelated), "roadx-265-r17-rxmotion-123");
  assert.equal(
    buildProductSlug({ ...noProfileRelated, profile: "0.00" }),
    "roadx-265-r17-rxmotion-123",
  );
  assert.equal(buildProductSlug(noProfileProduct), buildProductSlug(noProfileRelated));
  assert.equal(buildProductUrl(noProfileProduct), "/llantas/roadx-265-r17-rxmotion-123");
  assert.equal(buildProductUrl(noProfileRelated), "/llantas/roadx-265-r17-rxmotion-123");
  assert.equal(formatProductMeasure(265, 0, 17), "265R17");
  assert.equal(formatProductMeasure(265, "0.00", 17), "265R17");
});

test("normalizes equivalent decimal dimensions without losing real precision", () => {
  const relatedProduct = {
    id: "123",
    brand: "RoadX",
    name: "RXMotion",
    design: "RXMotion",
    width: "265.00",
    profile: "65.0",
    rim: "17.00",
    price: 4400,
    stock: 3,
    imageUrl: "",
  };
  assert.equal(buildProductSlug(relatedProduct), "roadx-265-65-r17-rxmotion-123");
  assert.equal(formatProductMeasure("265.00", "65.0", "17.00"), "265/65R17");
  assert.equal(
    formatProductMeasure("265.5", "65.25", "17.5"),
    "265.5/65.25R17.5",
  );
});

test("does not canonicalize a previous product during an A-to-B route change", () => {
  const productA = { ...product, id: "10", name: "Product A" };
  const productB = { ...product, id: "20", name: "Product B" };
  const slugB = "roadx-265-65-r17-product-b-20";

  assert.equal(getCanonicalProductRedirect(productA, "20", slugB), null);
  assert.equal(getCanonicalProductRedirect(productB, "20", slugB), null);
  assert.equal(
    getCanonicalProductRedirect(productB, "20", "wrong-slug-20"),
    "/llantas/roadx-265-65-r17-product-b-20",
  );
});

test("extracts only a final numeric product ID", () => {
  assert.equal(extractProductIdFromSlug("roadx-265-65-r17-rxmotion-123"), "123");
  assert.equal(extractProductIdFromSlug("abc"), null);
  assert.equal(extractProductIdFromSlug("roadx-abc"), null);
});

test("normalizes product image asset paths without duplicating public folders", () => {
  const baseUrl = "https://api.grupoinversan.com";
  const paths = new Map([
    ["tire.jpg", `${baseUrl}/public/tire.jpg`],
    ["/productos/tire.jpg", `${baseUrl}/public/productos/tire.jpg`],
    ["public/productos/tire.jpg", `${baseUrl}/public/productos/tire.jpg`],
    ["/public/productos/tire.jpg", `${baseUrl}/public/productos/tire.jpg`],
    [
      "public/public/productos/tire.jpg",
      `${baseUrl}/public/productos/tire.jpg`,
    ],
  ]);
  for (const [imagePath, expected] of paths) {
    assert.equal(
      normalizeApiAssetUrlForBase(imagePath, baseUrl, "public", true),
      expected,
    );
  }
  assert.equal(
    normalizeApiAssetUrlForBase(
      "https://api.grupoinversan.com/public/productos/tire.jpg",
      baseUrl,
      "public",
      true,
    ),
    `${baseUrl}/public/productos/tire.jpg`,
  );
  assert.equal(
    normalizeApiAssetUrlForBase(
      "https://images.example.com/tire.jpg",
      baseUrl,
      "public",
      true,
    ),
    "https://images.example.com/tire.jpg",
  );
});

test("builds public Product and Offer structured data from the displayed product", () => {
  const structuredProduct = {
    ...product,
    design: "RXMotion",
    category: "Llanta",
    description: "<p>Llanta real</p>",
    images: [
      { id: "1", url: "tire.jpg", alt: "Llanta" },
      { id: "2", url: "data:image/png;base64,abc", alt: "Inválida" },
      { id: "3", url: "blob:https://example.test/abc", alt: "Inválida" },
    ],
    specs: [
      { label: "Alto", value: "265" },
      { label: "Perfil", value: "65" },
      { label: "Rin", value: "17" },
      { label: "Índice de carga", value: "112" },
      { label: "Índice de velocidad", value: "H" },
      { label: "Profundidad", value: "N/A" },
    ],
  };
  const data = buildProductStructuredData(structuredProduct, {
    siteUrl: "https://grupoinversan.com",
    apiBaseUrl: "https://api.grupoinversan.com",
  });

  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "Product");
  assert.equal(data.name, "Llanta RoadX 265/65R17 RXMotion");
  assert.equal(data.sku, "123");
  assert.equal(data.category, "Llanta");
  assert.equal(data.url, "https://grupoinversan.com/llantas/roadx-265-65-r17-rxmotion-123");
  assert.equal(data.description, "Llanta real");
  assert.deepEqual(data.brand, { "@type": "Brand", name: "RoadX" });
  assert.deepEqual(data.image, ["https://api.grupoinversan.com/public/tire.jpg"]);
  assert.deepEqual(data.offers, {
    "@type": "Offer",
    url: data.url,
    priceCurrency: "HNL",
    price: "4400.00",
    availability: "https://schema.org/InStock",
  });
  assert.deepEqual(data.additionalProperty, [
    { "@type": "PropertyValue", name: "Ancho", value: "265" },
    { "@type": "PropertyValue", name: "Perfil", value: "65" },
    { "@type": "PropertyValue", name: "Rin", value: "17" },
    { "@type": "PropertyValue", name: "Índice de carga", value: "112" },
    { "@type": "PropertyValue", name: "Índice de velocidad", value: "H" },
  ]);
  assert.equal("itemCondition" in data.offers, false);

  const soldOut = buildProductStructuredData(
    { ...structuredProduct, stock: 0 },
    {
      siteUrl: "https://grupoinversan.com",
      apiBaseUrl: "https://api.grupoinversan.com",
      availabilityStock: 0,
    },
  );
  assert.equal(soldOut.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(buildProductUrl({ ...structuredProduct, stock: 0 }), data.url.replace("https://grupoinversan.com", ""));
});

test("omits absent brand and invalid images and sanitizes JSON-LD serialization", () => {
  const unsafeProduct = {
    ...product,
    brand: "",
    description: "</script><script>alert(1)</script>",
    images: [
      { id: "1", url: "data:image/png;base64,abc", alt: "data" },
      { id: "2", url: "blob:https://example.test/abc", alt: "blob" },
    ],
    specs: [
      { label: "Alto", value: "265" },
      { label: "Perfil", value: "0" },
      { label: "Rin", value: "17" },
    ],
  };
  const data = buildProductStructuredData(unsafeProduct, {
    siteUrl: "https://grupoinversan.com",
    apiBaseUrl: "https://api.grupoinversan.com",
    isTireProduct: true,
  });

  const serialized = serializeForScript(data);

  assert.equal(data.category, "Llantas");
  assert.equal("brand" in data, false);
  assert.equal("image" in data, false);
  assert.equal(data.description, "Compra llanta 265R17 RXMotion en Inversan Honduras. Consulta precio, disponibilidad, especificaciones y sucursales.");
  assert.equal(
    data.additionalProperty?.some((property) => property.name === "Perfil"),
    false,
  );
  assert.doesNotMatch(serialized, /<\/script/i);
  assert.doesNotMatch(serialized, /<script>alert\(1\)<\/script>/i);
  assert.deepEqual(JSON.parse(serialized), data);
  assert.equal(
    serializeForScript({ text: "<&>\u2028\u2029" }),
    '{"text":"\\u003c\\u0026\\u003e\\u2028\\u2029"}',
  );
});

  test("builds canonical tire-size slugs and preserves real decimal precision", () => {
    assert.equal(buildTireSizeSlug(205, 55, 16), "205-55-r16");
    assert.equal(buildTireSizeUrl(205, 55, 16), "/llantas/205-55-r16");
    assert.deepEqual(parseTireSizeSlug("205-55-r16"), {
      width: "205",
      profile: "55",
      rim: "16",
    });
    assert.equal(buildTireSizeSlug(265, 0, 17), "265-r17");
    assert.equal(buildTireSizeSlug(265, "0.00", "17.00"), "265-r17");
    assert.equal(buildTireSizeSlug("265.50", "65.25", "17.00"), "265p5-65p25-r17");
    assert.deepEqual(parseTireSizeSlug("265p5-65p25-r17"), {
      width: "265.5",
      profile: "65.25",
      rim: "17",
    });
    assert.equal(parseTireSizeSlug("999-99-r99")?.width, "999");
    assert.equal(parseTireSizeSlug("not-a-size"), null);
  });

  test("vehicle slugs normalize accents and have canonical URL structure", () => {
    const vehicle = {
      brand: "Toyota",
      model: "Hilux",
      year: 2023,
      version: "SRV",
    };
    assert.equal(buildVehicleSlug(vehicle), "toyota/hilux/2023/srv");
    assert.equal(
      buildVehicleUrl(vehicle),
      "/llantas/vehiculo/toyota/hilux/2023/srv",
    );
    assert.equal(
      buildVehicleUrl({ brand: "Citroën", model: "C4 Cactus", year: 2022 }),
      "/llantas/vehiculo/citroen/c4-cactus/2022",
    );
  });

  test("global structured data uses configured public fields and omits private GPS data", () => {
    const siteUrl = "https://grupoinversan.com";
    const organization = buildOrganizationStructuredData(siteUrl);
    const branches = buildTireShopStructuredData(
      [{
        id: "2",
        name: "Sucursal Centro",
        address: "Avenida Principal",
        municipality: "San Pedro Sula",
        department: "Cortés",
        latitude: 15.5,
        longitude: -87.9,
      }],
      siteUrl,
    );
    const breadcrumb = buildBreadcrumbStructuredData(
      [
        { name: "Inicio", path: "/" },
        { name: "Llantas 205/55R16", path: "/llantas/205-55-r16" },
      ],
      siteUrl,
    );

    assert.equal(organization["@type"], "Organization");
    assert.equal(organization.logo, `${siteUrl}/logo.svg`);
    assert.equal("sameAs" in organization, false);
    assert.equal(branches[0]["@type"], "TireShop");
    assert.deepEqual(branches[0].geo, {
      "@type": "GeoCoordinates",
      latitude: 15.5,
      longitude: -87.9,
    });
    assert.equal(JSON.stringify(branches).includes("attendance_radius_m"), false);
    assert.equal(JSON.stringify(branches).includes("location_configured"), false);
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.equal(
    breadcrumb.itemListElement[1].item,
    `${siteUrl}/llantas/205-55-r16`,
  );
});

test("structured data availability stays global while UI stock changes by branch", () => {
  const globallyAvailableProduct = {
    ...product,
    stock: 0,
    images: [{ id: "1", url: "tire.jpg", alt: "Llanta" }],
  };
  const hydrated = buildProductStructuredData(globallyAvailableProduct, {
    siteUrl: "https://grupoinversan.com",
    apiBaseUrl: "https://api.grupoinversan.com",
    availabilityStock: 10,
    isTireProduct: true,
  });
  assert.equal(globallyAvailableProduct.stock, 0);
  assert.equal(hydrated.offers.availability, "https://schema.org/InStock");

  const afterBranchChange = buildProductStructuredData(
    { ...globallyAvailableProduct, stock: 3 },
    {
      siteUrl: "https://grupoinversan.com",
      apiBaseUrl: "https://api.grupoinversan.com",
      availabilityStock: 10,
      isTireProduct: true,
    },
  );
  assert.equal(afterBranchChange.offers.availability, "https://schema.org/InStock");
});
