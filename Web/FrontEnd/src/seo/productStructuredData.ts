import type { Product } from "../types/product";
import { normalizeApiAssetUrlForBase } from "../config/assetUrlCore.ts";
import { buildProductSeo, buildProductUrl } from "./productSeo.ts";

interface ProductStructuredDataOptions {
  siteUrl: string;
  apiBaseUrl: string;
  availabilityStock?: number;
  isTireProduct?: boolean;
}

interface PropertyValue {
  "@type": "PropertyValue";
  name: string;
  value: string;
}

interface ProductStructuredData {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: { "@type": "Brand"; name: string };
  category?: string;
  url: string;
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: "HNL";
    price?: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  };
  additionalProperty?: PropertyValue[];
}

export function buildProductStructuredData(
  product: Product,
  {
    siteUrl,
    apiBaseUrl,
    availabilityStock = product.stock,
    isTireProduct = false,
  }: ProductStructuredDataOptions,
): ProductStructuredData {
  const seo = buildProductSeo(product);
  const description =
    cleanPlainText(product.description) || cleanPlainText(seo.description);
  const url = new URL(buildProductUrl(product), siteUrl).toString();
  const price = Number(product.price);
  const stock = Number(availabilityStock);
  const brand = cleanPlainText(product.brand);
  const sku = cleanPlainText(product.id);
  const category = cleanPlainText(product.category);
  const images = [...new Set(
    (product.images ?? [])
      .map((image) => normalizeApiAssetUrlForBase(image.url, apiBaseUrl, "public", true))
      .filter(isPublicHttpUrl),
  )];
  const additionalProperty = (product.specs ?? [])
    .map(toPropertyValue)
    .filter((property): property is PropertyValue => property !== undefined);

  const offer: ProductStructuredData["offers"] = {
    "@type": "Offer",
    url,
    priceCurrency: "HNL",
    availability:
      Number.isFinite(stock) && stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
  };
  if (Number.isFinite(price)) offer.price = price.toFixed(2);

  const structuredData: ProductStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.heading,
    url,
    offers: offer,
  };

  if (description) structuredData.description = description;
  if (images.length > 0) structuredData.image = images;
  if (sku) structuredData.sku = sku;
  if (brand) {
    structuredData.brand = { "@type": "Brand", name: brand };
  }
  if (category) {
    structuredData.category = category;
  } else if (isTireProduct) {
    structuredData.category = "Llantas";
  }
  if (additionalProperty.length > 0) {
    structuredData.additionalProperty = additionalProperty;
  }

  return structuredData;
}

export function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function cleanPlainText(value?: string | null): string {
  const plainText = (value ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return Array.from(plainText, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? " " : character;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function toPropertyValue(spec: Product["specs"][number]): PropertyValue | undefined {
  const name = cleanPlainText(spec.label);
  const value = cleanPlainText(spec.value);
  if (
    !name ||
    !value ||
    /^(?:n\/a|null|undefined)$/i.test(value) ||
    (name.toLowerCase() === "perfil" &&
      (/^sin perfil$/i.test(value) || /^0+(?:\.0+)?$/.test(value)))
  ) {
    return undefined;
  }

  return {
    "@type": "PropertyValue",
    name: name.toLowerCase() === "alto" ? "Ancho" : name,
    value,
  };
}

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
