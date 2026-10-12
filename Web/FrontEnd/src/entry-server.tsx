import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import type { Product } from "./types/product";
import type { TireSizeLandingData, VehicleLandingData } from "./api/seo";

export {
  buildProductSeo,
  buildProductSlug,
  buildProductUrl,
  buildTireSizeSlug,
  buildTireSizeUrl,
  buildVehicleSlug,
  buildVehicleUrl,
  extractProductIdFromSlug,
  formatProductMeasure,
  normalizeSeoSlugPart,
  parseTireSizeSlug,
} from "./seo/productSeo";
export {
  buildProductStructuredData,
  serializeForScript,
} from "./seo/productStructuredData";
export {
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildTireShopStructuredData,
} from "./seo/globalStructuredData";
export { normalizeApiAssetUrlForBase } from "./config/assetUrlCore";

export function renderProductPage(path: string, product: Product): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes
        initialProduct={product}
        initialBranch={0}
        initialMenuOpen
      />
    </StaticRouter>,
  );
}

export function renderTireSizePage(
  path: string,
  data: TireSizeLandingData,
): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes
        initialTireSizeData={data}
        initialBranch={0}
        initialMenuOpen
      />
    </StaticRouter>,
  );
}

export function renderVehiclePage(
  path: string,
  data: VehicleLandingData,
): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes
        initialVehicleData={data}
        initialBranch={0}
        initialMenuOpen
      />
    </StaticRouter>,
  );
}

export function renderHomePage(): string {
  return renderToString(
    <StaticRouter location="/">
      <AppRoutes initialBranch={0} initialMenuOpen />
    </StaticRouter>,
  );
}

export function renderRoutePage(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes initialBranch={0} initialMenuOpen />
    </StaticRouter>,
  );
}
