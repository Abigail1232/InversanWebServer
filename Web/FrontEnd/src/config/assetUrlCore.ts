export type AssetFolder = "assets" | "public";

const resolveAssetFolder = (value: string, fallbackFolder: AssetFolder) => {
  const normalized = value.replace(/^\/+/, "").toLowerCase();
  if (normalized.startsWith("public/")) return "public";
  if (normalized.startsWith("assets/")) return "assets";
  return fallbackFolder;
};

const isOwnBackendUrl = (url: URL, apiBase: string) => {
  const configured = new URL(apiBase);
  const origin = `${url.hostname.toLowerCase()}${url.port ? `:${url.port}` : ""}`;
  const configuredOrigin = `${configured.hostname.toLowerCase()}${configured.port ? `:${configured.port}` : ""}`;
  return (
    origin === configuredOrigin ||
    origin === "localhost:3000" ||
    origin === "127.0.0.1:3000" ||
    origin === "api.grupoinversan.com"
  );
};

function normalizePath(value: string, fallbackFolder: AssetFolder) {
  let relativeValue = value.replace(/^\/+/, "");
  const folder = resolveAssetFolder(relativeValue, fallbackFolder);
  while (/^(assets|public)\//i.test(relativeValue)) {
    relativeValue = relativeValue.replace(/^(assets|public)\//i, "");
  }
  const withoutFolder = relativeValue.replace(/^\/+/, "");
  return `${folder}/${withoutFolder}`.replace(/\/+$/, "");
}

export function normalizeApiAssetUrlForBase(
  value: string | null | undefined,
  apiBase: string,
  fallbackFolder: AssetFolder = "assets",
  ensureFolderForAbsolute = false,
): string {
  const cleanValue = value?.trim();
  if (!cleanValue) return "";
  if (cleanValue.startsWith("data:") || cleanValue.startsWith("blob:")) {
    return cleanValue;
  }

  const normalizedBase = apiBase.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(cleanValue)) {
    return `${normalizedBase}/${normalizePath(cleanValue, fallbackFolder)}`;
  }

  try {
    const parsedUrl = new URL(cleanValue);
    if (!isOwnBackendUrl(parsedUrl, normalizedBase)) return cleanValue;
    const absolutePath = parsedUrl.pathname.replace(/^\/+/, "");
    const hasFolderPrefix = /^(assets|public)\//i.test(absolutePath);
    const normalizedPath =
      hasFolderPrefix || ensureFolderForAbsolute
        ? normalizePath(parsedUrl.pathname, fallbackFolder)
        : absolutePath;
    return `${normalizedBase}/${normalizedPath}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return `${normalizedBase}/${normalizePath(cleanValue, fallbackFolder)}`;
  }
}
