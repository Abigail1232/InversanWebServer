import api from "../axios";

export interface BrandItem {
  id: number;
  name: string;
  imageUrl?: string | null;
}

export interface BrandProductItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  promotionDisplayMode?: "porcentaje" | "precio_tachado";
  imageUrl: string;
  stock: number;
}

export interface BrandYearItem {
  year: number;
}

export interface BrandModelItem {
  name: string;
}

export interface BrandVersionItem {
  id: number;
  name: string;
}

interface BrandsResponse {
  data?: Array<{
    id_marca: number;
    nombre: string;
    imagen_url?: string | null;
  }>;
}


interface CarBrandResponse {
  data?: Array<{
    marca: string;
  }>;
}

interface BrandProductsResponse {
  datos?: {
    marca?: string;
    logo_url?: string | null;
    banner_url?: string | null;
    total_productos?: number;
    productos?: Array<{
      id_producto: number;
      nombre: string;
      marca: string;
      precio_detalle: number;
      precio_original?: number;
      descuento?: number;
      imagen_principal: string | null;
      stock_total: number;
    }>;
  };
  pagination?: { currentPage: number; pageSize: number; totalPages: number };
}

export async function getBrands(): Promise<BrandItem[]> {
  const res = await api.get<BrandsResponse>("/api/products/marcas");
  const items = res.data?.data ?? [];

  return items.map((item) => ({
    id: item.id_marca,
    name: item.nombre,
    imageUrl: item.imagen_url ?? null,
  }));
}

export async function getBrandNames(): Promise<string[]> {
  const res = await api.get<CarBrandResponse>("/api/products/marcas-nombres");
  const items = res.data?.data ?? [];

  return items.map((item) => (
    item.marca
  ));
}

export const PAGE_SIZE = 8;

export async function getProductsByBrand(
  branchId: number | undefined,
  brandId: number,
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{
  brandName: string;
  products: BrandProductItem[];
  totalProductos: number;
  totalPages: number;
  bannerUrl?: string | null;
  logoUrl?: string | null;
}> {
  const params = new URLSearchParams();
  params.append('id_marca', String(brandId));
  if (branchId && branchId > 0) {
    params.append('id_sucursal', String(branchId));
  }
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));

  const res = await api.get<BrandProductsResponse>("/api/products/productos-marcas", {
    params: Object.fromEntries(params),
  });

  const brandName = res.data?.datos?.marca ?? "";
  const productsRaw = res.data?.datos?.productos ?? [];

  return {
    brandName,
    products: productsRaw.map((item) => ({
      id: String(item.id_producto),
      name: item.nombre,
      brand: item.marca,
      price: item.precio_detalle,
      originalPrice: item.precio_original,
      discountPercent: item.descuento,
      promotionDisplayMode: (item as any).promotionDisplayMode,
      imageUrl: item.imagen_principal ?? "",
      stock: item.stock_total,
    })),
    totalProductos: res.data?.datos?.total_productos ?? productsRaw.length,
    totalPages: res.data?.pagination?.totalPages ?? Math.max(1, Math.ceil((res.data?.datos?.total_productos ?? productsRaw.length) / pageSize)),
    bannerUrl: res.data?.datos?.banner_url ?? null,
    logoUrl: res.data?.datos?.logo_url ?? null,
  };
}

export async function getBrandYears(
  vehicleMake: string,
): Promise<BrandYearItem[]> {
  const res = await api.get<{ data?: number[] }>("/api/products/marca-anios", {
    params: { marca: vehicleMake },
  });

  const years = res.data?.data ?? [];
  return years.map((y) => ({ year: y }));
}

export async function getBrandModels(
  vehicleMake: string,
  year: number,
): Promise<BrandModelItem[]> {
  const res = await api.get<{ data?: string[] }>(
    "/api/products/marca-modelos",
    {
      params: { marca: vehicleMake, anio: year },
    },
  );

  const models = res.data?.data ?? [];
  return models.map((name) => ({ name }));
}

export async function getBrandVersions(
  vehicleMake: string,
  year: number,
  modelName: string,
): Promise<BrandVersionItem[]> {
  const res = await api.get<{ data?: string[] }>(
    "/api/products/marca-versiones",
    {
      params: { marca: vehicleMake, anio: year, modelo: modelName },
    },
  );

  const items = res.data?.data ?? [];
  return items.map((name, index) => ({
    id: index + 1,
    name,
  }));
}

