import type { Product, RelatedProduct } from "../types/product";

type ProductSlugSource = Pick<Product, "id" | "brand" | "name" | "specs"> & {
  design?: string | null;
};

type ProductSeoSource = ProductSlugSource | RelatedProduct;

export function normalizeProductDimension(
  value?: string | number | null,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || /^(?:n\/a|sin perfil)$/i.test(trimmed)) return undefined;

  const decimal = trimmed.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!decimal) return trimmed;

  const [, sign, integer, fraction] = decimal;
  const normalizedInteger = integer.replace(/^0+(?=\d)/, "");
  const normalizedFraction = fraction?.replace(/0+$/, "");
  return `${sign === "+" ? "" : sign}${normalizedInteger}${
    normalizedFraction ? `.${normalizedFraction}` : ""
  }`;
}

export function normalizeProductProfile(
  value?: string | number | null,
): string | undefined {
  const normalized = normalizeProductDimension(value);
  return normalized === "0" ? undefined : normalized;
}

function dimensionsFor(product: ProductSeoSource) {
  if ("specs" in product) {
    const valueFor = (label: string) =>
      product.specs.find(
        (spec) => spec.label.toLowerCase() === label.toLowerCase(),
      )?.value;
    return {
      width: normalizeProductDimension(valueFor("Alto")),
      profile: normalizeProductProfile(valueFor("Perfil")),
      rim: normalizeProductDimension(valueFor("Rin")),
    };
  }
  return {
    width: normalizeProductDimension(product.width),
    profile: normalizeProductProfile(product.profile),
    rim: normalizeProductDimension(product.rim),
  };
}

export function buildProductSlug(product: ProductSeoSource): string {
  const { width, profile, rim } = dimensionsFor(product);
  const dimensionSlug = (value: string | undefined) =>
    value?.replace(".", "p");
  const dimensions = [
    dimensionSlug(width),
    dimensionSlug(profile),
    rim ? `r${rim.replace(".", "p")}` : undefined,
  ]
    .filter(Boolean)
    .join("-");
  const name = ("design" in product ? product.design : undefined) || product.name;

  return [
    product.brand,
    dimensions,
    name,
    product.id,
  ]
    .map((part) => normalizeSlugPart(part))
    .filter(Boolean)
    .join("-");
}

export function buildProductUrl(product: ProductSeoSource): string {
  return `/llantas/${buildProductSlug(product)}`;
}

export function extractProductIdFromSlug(slug: string): string | null {
  const match = slug.match(/(?:^|-)(\d+)$/);
  return match?.[1] ?? null;
}

export function getCanonicalProductRedirect(
  product: ProductSeoSource | null | undefined,
  productId: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  if (
    !product ||
    !productId ||
    !slug ||
    String(product.id) !== String(productId)
  ) {
    return null;
  }

  const canonicalSlug = buildProductSlug(product);
  return slug === canonicalSlug ? null : buildProductUrl(product);
}

export function buildProductSeo(product: ProductSeoSource) {
  const { width, profile, rim } = dimensionsFor(product);
  const measure = formatProductMeasure(width, profile, rim);
  const design = ("design" in product ? product.design : undefined) || product.name;
  const heading = [
    "Llanta",
    product.brand,
    measure,
    design,
  ]
    .filter(Boolean)
    .join(" ");
  const titleSuffix = " | Inversan Honduras";
  const title = `${(heading || "Llanta")
    .slice(0, 70 - titleSuffix.length)
    .trimEnd()}${titleSuffix}`;
  const description = [
    `Compra llanta ${[product.brand, measure, design].filter(Boolean).join(" ")} en Inversan Honduras.`,
    "Consulta precio, disponibilidad, especificaciones y sucursales.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 160);

  return {
    title,
    description,
    heading,
    measure,
    canonicalPath: buildProductUrl(product),
  };
}

export function formatProductMeasure(
  width?: string | number,
  profile?: string | number,
  rim?: string | number,
): string {
  const normalizedWidth = normalizeProductDimension(width);
  const normalizedProfile = normalizeProductProfile(profile);
  const normalizedRim = normalizeProductDimension(rim);
  const parts = [normalizedWidth, normalizedProfile].filter(Boolean);
  if (!parts.length || !normalizedRim) return "";
  return `${parts.join("/")}R${normalizedRim}`;
}

function normalizeSlugPart(value: string | undefined | null): string {
  return value ? normalizeSeoSlugPart(value) : "";
}

export interface TireSize {
  width: string;
  profile: string;
  rim: string;
}

export function buildTireSizeSlug(
  width?: string | number | null,
  profile?: string | number | null,
  rim?: string | number | null,
): string {
  const normalizedWidth = normalizeProductDimension(width);
  const normalizedProfile = normalizeProductProfile(profile);
  const normalizedRim = normalizeProductDimension(rim);
  if (!normalizedWidth || !normalizedRim) return "";

  const dimensionSlug = (value: string) => value.replace(".", "p");
  return [
    dimensionSlug(normalizedWidth),
    normalizedProfile ? dimensionSlug(normalizedProfile) : undefined,
    `r${dimensionSlug(normalizedRim)}`,
  ]
    .filter(Boolean)
    .join("-");
}

export function parseTireSizeSlug(slug: string): TireSize | null {
  const match = slug.match(
    /^(\d+(?:p\d+)?)(?:-(\d+(?:p\d+)?))?-r(\d+(?:p\d+)?)$/i,
  );
  if (!match) return null;
  const [, widthToken, profileToken, rimToken] = match;
  const width = normalizeProductDimension(widthToken.replace(/p/gi, "."));
  const profile = normalizeProductDimension(
    (profileToken ?? "0").replace(/p/gi, "."),
  );
  const rim = normalizeProductDimension(rimToken.replace(/p/gi, "."));
  if (
    !width ||
    !profile ||
    !rim ||
    Number(width) <= 0 ||
    Number(profile) < 0 ||
    Number(rim) <= 0
  ) {
    return null;
  }
  return { width, profile, rim };
}

export function buildTireSizeUrl(
  width?: string | number | null,
  profile?: string | number | null,
  rim?: string | number | null,
): string {
  const slug = buildTireSizeSlug(width, profile, rim);
  return slug ? `/llantas/${slug}` : "";
}

export interface VehicleSlugSource {
  brand: string;
  model: string;
  year: string | number;
  version?: string | null;
}

export function buildVehicleSlug(vehicle: VehicleSlugSource): string {
  return [
    normalizeSeoSlugPart(vehicle.brand),
    normalizeSeoSlugPart(vehicle.model),
    String(vehicle.year).trim(),
    vehicle.version ? normalizeSeoSlugPart(vehicle.version) : "",
  ]
    .filter(Boolean)
    .join("/");
}

export function buildVehicleUrl(vehicle: VehicleSlugSource): string {
  const slug = buildVehicleSlug(vehicle);
  return slug ? `/llantas/vehiculo/${slug}` : "";
}

export function normalizeSeoSlugPart(value: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
