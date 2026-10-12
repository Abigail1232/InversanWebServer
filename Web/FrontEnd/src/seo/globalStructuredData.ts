export interface PublicBranch {
  id: string;
  name: string;
  address: string;
  municipality: string;
  department: string;
  latitude: number | null;
  longitude: number | null;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildOrganizationStructuredData(siteUrl: string, logoPath = "/logo.svg") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Inversan",
    url: siteUrl,
    logo: new URL(logoPath, siteUrl).toString(),
  };
}

export function buildTireShopStructuredData(
  branches: PublicBranch[],
  siteUrl: string,
) {
  return branches.map((branch) => {
    const address: Record<string, string> = {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressCountry: "HN",
    };
    if (branch.municipality) address.addressLocality = branch.municipality;
    if (branch.department) address.addressRegion = branch.department;

    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "TireShop",
      "@id": `${siteUrl}/#branch-${encodeURIComponent(branch.id)}`,
      name: `Inversan - ${branch.name}`,
      url: `${siteUrl}/contact`,
      address,
    };
    if (
      Number.isFinite(branch.latitude) &&
      Number.isFinite(branch.longitude) &&
      branch.latitude !== null &&
      branch.longitude !== null
    ) {
      structuredData.geo = {
        "@type": "GeoCoordinates",
        latitude: branch.latitude,
        longitude: branch.longitude,
      };
    }
    return structuredData;
  });
}

export function buildBreadcrumbStructuredData(
  items: BreadcrumbItem[],
  siteUrl: string,
) {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.path, siteUrl).toString(),
  }));
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
