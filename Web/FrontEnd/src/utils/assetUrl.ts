const FALLBACK_API_BASE = "https://api.grupoinversan.com";

export function buildAssetUrl(value?: string | null, folder: "assets" | "public" = "assets") {
  if (!value) return "";

  const cleanValue = String(value).trim();
  if (!cleanValue) return "";

  if (
    cleanValue.startsWith("http://") ||
    cleanValue.startsWith("https://") ||
    cleanValue.startsWith("data:")
  ) {
    return cleanValue;
  }

  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) || FALLBACK_API_BASE)
    .replace(/\/$/, "");

  const normalizedValue = cleanValue.replace(/^\/+/, "");

  if (normalizedValue.startsWith("assets/") || normalizedValue.startsWith("public/")) {
    return `${apiBase}/${normalizedValue}`;
  }

  const safePath = normalizedValue
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${apiBase}/${folder}/${safePath}`;
}
