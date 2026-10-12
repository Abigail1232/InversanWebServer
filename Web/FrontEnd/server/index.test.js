import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildMerchantFeed,
  buildSitemapUrlList,
  buildSitemapXml,
  createSsrServer,
} from "./index.js";
import {
  renderHomePage,
  renderProductPage,
  renderRoutePage,
  renderTireSizePage,
  renderVehiclePage,
} from "../dist/server/entry-server.bundle.js";

const template = `<!doctype html>
<html lang="en"><head><title>SPA</title></head>
<body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;

const validProduct = {
  id_producto: 123,
  nombre: "RXMotion",
  marca: "RoadX",
  categoria: "Llanta",
  descripcion: "Llanta para todo terreno </script><script>alert(1)</script>",
  imagen_3d: null,
  diseno: { nombre: "RXMotion" },
  especificaciones: {
    rin: 17,
    ancho_rin: 265,
    alto_rin: 65,
    lonas: 0,
    profundidad: 0,
    indice_de_carga: 0,
    presion_maxima: 0,
    indice_velocidad: "",
  },
  precios: { detalle: 4400, mayoreo: 0, coste: 999 },
  imagenes: [{ id: 1, url: "tire.jpg", orden: 1 }],
  promociones: [],
  stock_total: 0,
};

const publicCatalog = {
  products: [
    {
      id: "123",
      brand: "RoadX",
      name: "RXMotion",
      design: "RXMotion",
      width: "265.00",
      profile: "65.00",
      rim: "17.00",
      price: 4400,
      stock: 0,
      imageUrl: "https://api.grupoinversan.com/public/tire.jpg",
      description: "Llanta RoadX",
      price_cost: 999,
      vehicles: [
        { brand: "Toyota", model: "Hilux", year: 2023, version: null },
        { brand: "Toyota", model: "Hilux", year: 2023, version: "SRV" },
      ],
    },
    {
      id: "124",
      brand: "RoadX",
      name: "RXMotion",
      design: "RXMotion",
      width: "205.00",
      profile: "55.00",
      rim: "16.00",
      price: 3500,
      stock: 5,
      imageUrl: "https://api.grupoinversan.com/public/tire.jpg",
      description: "Llanta RoadX",
      vehicles: [
        { brand: "Toyota", model: "Hilux", year: 2023, version: "SRV" },
      ],
    },
  ],
};

test("SSR product routing returns HTML, canonical redirects, and real error statuses", async (context) => {
  const distDirectory = await mkdtemp(path.join(os.tmpdir(), "inversan-ssr-"));
  await mkdir(distDirectory, { recursive: true });
  await writeFile(path.join(distDirectory, "index.html"), template);
  const server = createSsrServer({
    distDirectory,
    apiBase: "http://api.test",
    siteUrl: "https://grupoinversan.com",
    fetchImpl: async (url) => {
      const requestedUrl = new URL(String(url));
      if (requestedUrl.pathname === "/api/seo/catalog") {
        return new Response(JSON.stringify(publicCatalog), { status: 200 });
      }
      if (requestedUrl.pathname === "/api/seo/business-locations") {
        return new Response(JSON.stringify({
          branches: [{
            id: "1",
            name: "Sucursal Centro",
            address: "Avenida Principal",
            municipality: "San Pedro Sula",
            department: "Cortés",
            latitude: 15.5,
            longitude: -87.9,
          }],
        }), { status: 200 });
      }
      if (requestedUrl.pathname === "/api/seo/tire-size") {
        if (requestedUrl.searchParams.get("width") === "999") {
          return new Response("{}", { status: 404 });
        }
        return new Response(JSON.stringify({
          products: [{
            id: "124",
            brand: "RoadX",
            name: "RXMotion",
            design: "RXMotion",
            width: "205",
            profile: "55",
            rim: "16",
            price: 3500,
            stock: 5,
            imageUrl: "tire.jpg",
          }],
          pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
        }), { status: 200 });
      }
      if (requestedUrl.pathname === "/api/seo/vehicle") {
        return new Response(JSON.stringify({
          vehicle: {
            brand: "Toyota",
            model: "Hilux",
            year: 2023,
            version: requestedUrl.searchParams.get("version") ? "SRV" : null,
          },
          products: [{
            id: "124",
            brand: "RoadX",
            name: "RXMotion",
            design: "RXMotion",
            width: "205",
            profile: "55",
            rim: "16",
            price: 3500,
            stock: 5,
            imageUrl: "tire.jpg",
          }],
          pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
        }), { status: 200 });
      }
      const requestedId = requestedUrl.pathname.split("/").pop();
      if (requestedId === "999") return new Response("{}", { status: 404 });
      if (requestedId === "500") return new Response("{}", { status: 500 });
      return new Response(JSON.stringify({
          producto: {
            ...validProduct,
            id_producto: Number(requestedId),
            stock_total: requestedId === "124" ? 5 : 0,
            promociones: requestedId === "124"
              ? [{
                  descuento: 10,
                  tipo_descuento: "monto",
                  precio_promocion: 3500,
                  promocion: {
                    fecha_inicio: "2020-01-01T00:00:00.000Z",
                    fecha_finalizacion: "2030-01-01T00:00:00.000Z",
                    mostrar_precio_porcentaje: false,
                    mostrar_precio_tachado: true,
                  },
                }]
              : [],
          },
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
    },
    renderProduct: renderProductPage,
    renderTireSize: renderTireSizePage,
    renderVehicle: renderVehiclePage,
    renderHome: renderHomePage,
    renderRoute: renderRoutePage,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(distDirectory, { recursive: true, force: true });
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  await context.test("renders fresh product content, metadata, and zero-stock state", async () => {
    const response = await fetch(`${baseUrl}/llantas/roadx-265-65-r17-rxmotion-123`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<html lang="es-HN">/);
    assert.match(html, /<title>Llanta RoadX 265\/65R17 RXMotion \| Inversan Honduras<\/title>/);
    assert.match(html, /name="description"/);
    assert.match(html, /rel="canonical" href="https:\/\/grupoinversan\.com\/llantas\/roadx-265-65-r17-rxmotion-123"/);
    assert.match(html, /property="og:image" content="http:\/\/api\.test\/public\/tire\.jpg"/);
    assert.match(html, /<h1[^>]*>Llanta RoadX 265\/65R17 RXMotion<\/h1>/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /alt="Inversan Logo"/);
    assert.match(html, /Política de Devoluciones/);
    assert.match(html, /Lps\.[\s\S]*?4,400\.00[\s\S]*?c\/u/);
    assert.match(html, /Agotado temporalmente/);
    assert.match(html, /Llanta para todo terreno/);
    assert.match(html, /\\u003c\/script\\u003e/);
    assert.doesNotMatch(html, /"coste":999|<script>alert\(1\)<\/script>/);
    const jsonLdMatches = [
      ...html.matchAll(
        /<script type="application\/ld\+json" data-inversan-product-jsonld="true">([\s\S]*?)<\/script>/g,
      ),
    ];
    assert.equal(jsonLdMatches.length, 1);
    const structuredData = JSON.parse(jsonLdMatches[0][1]);
    assert.equal(structuredData["@context"], "https://schema.org");
    assert.equal(structuredData["@type"], "Product");
    assert.equal(structuredData.name, "Llanta RoadX 265/65R17 RXMotion");
    assert.equal(
      structuredData.url,
      "https://grupoinversan.com/llantas/roadx-265-65-r17-rxmotion-123",
    );
    assert.equal(structuredData.offers["@type"], "Offer");
    assert.equal(structuredData.offers.priceCurrency, "HNL");
    assert.equal(structuredData.offers.price, "4400.00");
    assert.equal(
      structuredData.offers.availability,
      "https://schema.org/OutOfStock",
    );
    assert.equal(structuredData.brand.name, "RoadX");
    assert.equal("coste" in structuredData, false);
    assert.equal("itemCondition" in structuredData.offers, false);
  });

  await context.test("renders an in-stock product as HTTP 200 with InStock structured data", async () => {
    const response = await fetch(
      `${baseUrl}/llantas/roadx-265-65-r17-rxmotion-124`,
    );
    const html = await response.text();
    assert.equal(response.status, 200);
    const jsonLd = html.match(
      /<script type="application\/ld\+json" data-inversan-product-jsonld="true">([\s\S]*?)<\/script>/,
    );
    assert.ok(jsonLd);
    const structuredData = JSON.parse(jsonLd[1]);
    assert.equal(
      structuredData.offers.availability,
      "https://schema.org/InStock",
    );
    assert.equal(structuredData.offers.price, "3500.00");
    assert.match(html, /3,500\.00/);
  });

  await context.test("redirects a wrong slug and legacy URL to the current canonical URL", async () => {
    for (const route of [
      "/llantas/cualquier-texto-123",
      "/product/123",
      "/llantas/roadx-265-65-r17-rxmotion-123/",
    ]) {
      const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
      assert.equal(response.status, 301);
      assert.equal(
        response.headers.get("location"),
        "https://grupoinversan.com/llantas/roadx-265-65-r17-rxmotion-123",
      );
    }
  });

  await context.test("returns a noindex 404 for invalid and nonexistent products", async () => {
    const invalid = await fetch(`${baseUrl}/llantas/not-a-product`);
    assert.equal(invalid.status, 404);
    assert.match(await invalid.text(), /name="robots" content="noindex"/);

    const missing = await fetch(`${baseUrl}/llantas/roadx-999`);
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert.match(missingHtml, /Producto no encontrado \| Inversan/);
    assert.doesNotMatch(missingHtml, /type="module"/);

    const failed = await fetch(`${baseUrl}/llantas/roadx-500`);
    assert.equal(failed.status, 500);
    assert.match(await failed.text(), /name="robots" content="noindex"/);
  });

  await context.test("renders real tire-size landing content and rejects missing sizes", async () => {
    const response = await fetch(`${baseUrl}/llantas/205-55-r16`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<title>Llantas 205\/55R16 en Honduras \| Inversan<\/title>/);
    assert.match(html, /name="description"[^>]*205\/55R16/);
    assert.match(html, /rel="canonical" href="https:\/\/grupoinversan\.com\/llantas\/205-55-r16"/);
    assert.match(
      html,
      /<h1[^>]*>Llantas(?:\s*<!-- -->)?205\/55R16(?:<!-- -->)? en Honduras<\/h1>/,
    );
    assert.match(html, /href="\/llantas\/roadx-205-55-r16-rxmotion-124"/);

    const missing = await fetch(`${baseUrl}/llantas/999-99-r99`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /name="robots" content="noindex"/);
  });

  await context.test("renders vehicle landings only from the public vehicle API result", async () => {
    const response = await fetch(
      `${baseUrl}/llantas/vehiculo/toyota/hilux/2023`,
    );
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<title>Llantas para Toyota Hilux 2023 \| Inversan Honduras<\/title>/);
    assert.match(html, /rel="canonical" href="https:\/\/grupoinversan\.com\/llantas\/vehiculo\/toyota\/hilux\/2023"/);
    assert.match(html, /<h1[^>]*>Llantas para Toyota Hilux 2023<\/h1>/);
    assert.match(html, /registradas como compatibles/);
    assert.match(html, /href="\/llantas\/roadx-205-55-r16-rxmotion-124"/);
  });

  await context.test("renders home Organization and configured TireShop structured data", async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<title>Llantas en Honduras para Carro, SUV y Pickup \| Inversan<\/title>/);
    assert.match(html, /<h1[^>]*>Llantas para tu vehículo/);
    assert.match(html, /data-inversan-global-jsonld="true"/);
    assert.match(html, /"@type":"TireShop"/);
    assert.match(html, /San Pedro Sula/);
    assert.doesNotMatch(html, /attendance_radius_m|location_configured/);
  });

  await context.test("marks temporary brand pages as noindex,follow", async () => {
    const response = await fetch(`${baseUrl}/brand/1`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /rel="canonical" href="https:\/\/grupoinversan\.com\/brand\/1"/);
    assert.match(html, /name="robots" content="noindex,follow"/);
  });

  await context.test("serves robots, sitemap, and merchant RSS from the public catalog", async () => {
    const robots = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robots.status, 200);
    assert.match(robots.headers.get("content-type"), /text\/plain/);
    assert.match(await robots.text(), /Sitemap: https:\/\/grupoinversan\.com\/sitemap\.xml/);

    const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get("content-type"), /application\/xml/);
    const sitemapXml = await sitemap.text();
    assert.match(sitemapXml, /<urlset/);
    assert.match(sitemapXml, /https:\/\/grupoinversan\.com\/llantas\/roadx-265-65-r17-rxmotion-123/);
    assert.match(sitemapXml, /https:\/\/grupoinversan\.com\/llantas\/205-55-r16/);
    assert.match(sitemapXml, /https:\/\/grupoinversan\.com\/llantas\/vehiculo\/toyota\/hilux\/2023/);
    assert.match(sitemapXml, /https:\/\/grupoinversan\.com\/contact/);
    assert.doesNotMatch(sitemapXml, /https:\/\/grupoinversan\.com\/brand\/1/);
    assert.doesNotMatch(sitemapXml, /<lastmod>/);
    const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.equal(new Set(locs).size, locs.length);
    assert.equal(
      locs.some((location) => {
        const url = new URL(location);
        return (
          url.search !== "" ||
          ["/admin", "/checkout", "/product/123"].some(
            (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
          )
        );
      }),
      false,
    );

    const feed = await fetch(`${baseUrl}/google-merchant.xml`);
    assert.equal(feed.status, 200);
    assert.match(feed.headers.get("content-type"), /application\/xml/);
    const feedXml = await feed.text();
    assert.match(feedXml, /<rss version="2\.0"/);
    assert.match(feedXml, /<g:price>4400\.00 HNL<\/g:price>/);
    assert.match(feedXml, /<g:availability>out_of_stock<\/g:availability>/);
    assert.match(feedXml, /<g:link>https:\/\/grupoinversan\.com\/llantas\/roadx-265-65-r17-rxmotion-123<\/g:link>/);
    assert.match(feedXml, /<g:image_link>https:\/\/api\.grupoinversan\.com\/public\/tire\.jpg<\/g:image_link>/);
    assert.doesNotMatch(feedXml, /price_cost|<g:gtin>|<g:mpn>|<g:condition>/);
  });

  await context.test("emits google site verification only when configured", async () => {
    const previousValue = process.env.GOOGLE_SITE_VERIFICATION;
    try {
      process.env.GOOGLE_SITE_VERIFICATION = "";
      const withoutVerification = await fetch(`${baseUrl}/contact`);
      const withoutHtml = await withoutVerification.text();
      assert.equal(withoutHtml.match(/name="google-site-verification"/g), null);

      process.env.GOOGLE_SITE_VERIFICATION = "google-test-token";
      const withVerification = await fetch(`${baseUrl}/contact`);
      const withHtml = await withVerification.text();
      assert.equal(
        (withHtml.match(/name="google-site-verification"/g) ?? []).length,
        1,
      );
      assert.match(
        withHtml,
        /<meta name="google-site-verification" content="google-test-token">/,
      );
    } finally {
      if (previousValue === undefined) {
        delete process.env.GOOGLE_SITE_VERIFICATION;
      } else {
        process.env.GOOGLE_SITE_VERIFICATION = previousValue;
      }
    }
  });
});

test("sitemap and merchant XML builders escape data and avoid query or legacy URLs", () => {
  const catalog = {
    products: [{
      id: "5",
      brand: "RoadX & Sons",
      name: "RX <Motion>",
      design: "RX <Motion>",
      width: "265",
      profile: "0",
      rim: "17",
      price: 100,
      stock: 1,
      imageUrl: "https://api.test/public/tire.jpg",
      description: "Llanta <strong>real</strong>",
      vehicles: [],
    }],
  };
  const urls = buildSitemapUrlList(catalog, "https://grupoinversan.com");
  const xml = buildSitemapXml(urls);
  const feed = buildMerchantFeed(
    catalog,
    "https://grupoinversan.com",
    "http://api.test",
  );
  assert.match(xml, /<urlset/);
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => new URL(match[1]),
  );
  assert.equal(
    locations.some(
      (url) =>
        url.search !== "" ||
        url.pathname === "/product/5" ||
        url.pathname.startsWith("/product/5/"),
    ),
    false,
  );
  assert.match(feed, /RoadX &amp; Sons/);
  assert.match(feed, /roadx-sons-265-r17-rx-motion-5/);
  assert.match(feed, /Llanta real/);
  assert.match(feed, /<g:image_link>https:\/\/api\.test\/public\/tire\.jpg<\/g:image_link>/);
  assert.doesNotMatch(feed, /cost/);
});

test("merchant XML includes only products with valid price and HTTPS image data", () => {
  const catalog = {
    products: [
      {
        id: "100",
        brand: "RoadX",
        name: "Normal",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 4,
        imageUrl: "https://api.test/public/normal.jpg",
        description: "Llanta normal",
      },
      {
        id: "101",
        brand: "RoadX",
        name: "Promo",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 3500,
        stock: 2,
        imageUrl: "https://api.test/public/promo.jpg",
        description: "Llanta promo",
      },
      {
        id: "102",
        brand: "RoadX",
        name: "Cero",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 0,
        stock: 2,
        imageUrl: "https://api.test/public/zero.jpg",
        description: "Llanta cero",
      },
      {
        id: "103",
        brand: "RoadX",
        name: "Negativa",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: -1,
        stock: 2,
        imageUrl: "https://api.test/public/negative.jpg",
        description: "Llanta negativa",
      },
      {
        id: "104",
        brand: "RoadX",
        name: "Sin imagen",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 2,
        imageUrl: "",
        description: "Llanta sin imagen",
      },
      {
        id: "105",
        brand: "RoadX",
        name: "Data",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 2,
        imageUrl: "data:image/png;base64,abc",
        description: "Llanta data",
      },
      {
        id: "106",
        brand: "RoadX",
        name: "Blob",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 2,
        imageUrl: "blob:https://api.test/blob",
        description: "Llanta blob",
      },
      {
        id: "107",
        brand: "RoadX",
        name: "HTTP",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 2,
        imageUrl: "http://api.test/public/http.jpg",
        description: "Llanta http",
      },
      {
        id: "108",
        brand: "RoadX",
        name: "Agotada",
        design: "RX",
        width: "205",
        profile: "55",
        rim: "16",
        price: 4400,
        stock: 0,
        imageUrl: "https://api.test/public/soldout.jpg",
        description: "Llanta agotada",
      },
    ],
  };
  const feed = buildMerchantFeed(catalog, "https://grupoinversan.com", "https://api.test");
  assert.equal((feed.match(/<item>/g) ?? []).length, 3);
  assert.match(feed, /<g:id>100<\/g:id>/);
  assert.match(feed, /<g:price>4400\.00 HNL<\/g:price>/);
  assert.match(feed, /<g:id>101<\/g:id>/);
  assert.match(feed, /<g:price>3500\.00 HNL<\/g:price>/);
  assert.match(feed, /<g:id>108<\/g:id>/);
  assert.match(feed, /<g:availability>out_of_stock<\/g:availability>/);
  for (const id of ["102", "103", "104", "105", "106", "107"]) {
    assert.doesNotMatch(feed, new RegExp(`<g:id>${id}</g:id>`));
  }
  assert.doesNotMatch(feed, /<g:condition>|<g:gtin>|<g:mpn>/);
});
