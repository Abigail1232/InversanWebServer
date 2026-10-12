import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PUBLIC_SITE_URL } from "../config/site";
import {
  buildBreadcrumbStructuredData,
  type BreadcrumbItem,
} from "../seo/globalStructuredData";

interface Props {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function SeoMetadata({
  title,
  description,
  canonicalPath,
  robots = "index,follow",
  breadcrumbs,
}: Props) {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("robots", robots);
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"][data-inversan-client-seo="true"]',
    ) ?? document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalPath) {
      const link = canonical ?? document.createElement("link");
      link.rel = "canonical";
      link.href = new URL(canonicalPath, PUBLIC_SITE_URL).toString();
      link.dataset.inversanClientSeo = "true";
      if (!link.isConnected) document.head.append(link);
    } else if (canonical?.dataset.inversanClientSeo === "true") {
      canonical.remove();
    }

    document
      .querySelector('[data-inversan-client-breadcrumbs="true"]')
      ?.remove();
    if (breadcrumbs?.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.inversanClientBreadcrumbs = "true";
      script.textContent = JSON.stringify(
        buildBreadcrumbStructuredData(breadcrumbs, PUBLIC_SITE_URL),
      );
      document.head.append(script);
    }
  }, [
    breadcrumbs,
    canonicalPath,
    description,
    location.pathname,
    location.search,
    robots,
    title,
  ]);

  return null;
}

function setMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
  meta.dataset.inversanClientSeo = "true";
}
