const defaultSiteUrl = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://grupoinversan.com";

export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL?.trim() || defaultSiteUrl
).replace(/\/+$/, "");
