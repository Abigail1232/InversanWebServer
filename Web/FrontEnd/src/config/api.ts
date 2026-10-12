import {
  normalizeApiAssetUrlForBase,
  type AssetFolder,
} from "./assetUrlCore";

const DEFAULT_LOCAL_API_URL = "http://localhost:3000";
const DEFAULT_PRODUCTION_API_URL = "https://api.grupoinversan.com";
const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
const defaultApiBase = import.meta.env.DEV
  ? DEFAULT_LOCAL_API_URL
  : DEFAULT_PRODUCTION_API_URL;

export const API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/+$/, "");

export function normalizeApiAssetUrl(
  value?: string | null,
  fallbackFolder: AssetFolder = "assets"
): string {
  return normalizeApiAssetUrlForBase(value, API_BASE_URL, fallbackFolder);
}

export function buildProductImageUrl(value?: string | null): string {
  return normalizeApiAssetUrlForBase(value, API_BASE_URL, "public", true);
}

export function buildApiUrl(path = ""): string {
  const safePath = (path ?? "").trim();

  if (!safePath) return API_BASE_URL;

  if (/^https?:\/\//i.test(safePath)) {
    return normalizeApiAssetUrl(safePath) || safePath;
  }

  const normalizedPath = safePath.replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedPath}`;
}

export function buildAssetUrl(
  value?: string | null,
  folder: AssetFolder = "assets"
): string {
  return normalizeApiAssetUrlForBase(value, API_BASE_URL, folder);
}