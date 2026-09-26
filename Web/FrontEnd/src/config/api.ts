const DEFAULT_LOCAL_API_URL = "http://localhost:3000";
const DEFAULT_PRODUCTION_API_URL = "https://api.grupoinversan.com";
const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
const defaultApiBase = import.meta.env.DEV
  ? DEFAULT_LOCAL_API_URL
  : DEFAULT_PRODUCTION_API_URL;

export const API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/+$/, "");

const isOwnBackendUrl = (url: URL): boolean => {
  const host = url.hostname.toLowerCase();
  const port = url.port;

  const exactMatches = [
    "localhost:3000",
    "127.0.0.1:3000",
    "api.grupoinversan.com",
  ];

  const normalizedHost = port ? `${host}:${port}` : host;

  return exactMatches.includes(normalizedHost);
};

const resolveAssetFolder = (value: string, fallback: "assets" | "public") => {
  const relativeValue = value.replace(/^\/+/, "").toLowerCase();

  if (relativeValue.startsWith("public/")) return "public";
  if (relativeValue.startsWith("assets/")) return "assets";

  return fallback;
};

export function normalizeApiAssetUrl(
  value?: string | null,
  fallbackFolder: "assets" | "public" = "assets"
): string {
  if (!value) return "";

  const cleanValue = value.trim();
  if (!cleanValue) return "";
  if (cleanValue.startsWith("data:") || cleanValue.startsWith("blob:")) return cleanValue;

  if (!/^https?:\/\//i.test(cleanValue)) {
    const folder = resolveAssetFolder(cleanValue, fallbackFolder);
    return buildAssetUrl(cleanValue, folder);
  }

  try {
    const parsedUrl = new URL(cleanValue);

    if (!isOwnBackendUrl(parsedUrl)) {
      return cleanValue;
    }

    return `${API_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return buildAssetUrl(cleanValue, fallbackFolder);
  }
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
  folder: "assets" | "public" = "assets"
): string {
  if (!value) return "";

  const cleanValue = String(value).trim();
  if (!cleanValue) return "";
  if (cleanValue.startsWith("data:") || cleanValue.startsWith("blob:")) return cleanValue;

  if (/^https?:\/\//i.test(cleanValue)) {
    return normalizeApiAssetUrl(cleanValue);
  }

  const relativeValue = cleanValue.replace(/^\/+/, "");
  const nextFolder = resolveAssetFolder(relativeValue, folder);
  const withoutFolderPrefix = relativeValue
    .replace(/^assets\//i, "")
    .replace(/^public\//i, "");
  const finalPath = withoutFolderPrefix
    ? `${nextFolder}/${withoutFolderPrefix.replace(/^\/+/, "")}`
    : nextFolder;

  return `${API_BASE_URL}/${finalPath.replace(/^\/+/, "")}`;
}