import api from "./axios";
import type { RelatedProduct } from "../types/product";

export interface SeoLandingProduct extends RelatedProduct {
  description?: string;
}

export interface TireSizeLandingData {
  products: SeoLandingProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface VehicleLandingData {
  vehicle: {
    brand: string;
    model: string;
    year: number;
    version: string | null;
  };
  products: SeoLandingProduct[];
  pagination: TireSizeLandingData["pagination"];
}

export async function getTireSizeLanding(
  width: string,
  profile: string,
  rim: string,
  page = 1,
): Promise<TireSizeLandingData> {
  const response = await api.get<TireSizeLandingData>("/api/seo/tire-size", {
    params: { width, profile, rim, page, pageSize: 12 },
  });
  return response.data;
}

export async function getVehicleLanding(
  brand: string,
  model: string,
  year: string,
  version?: string,
  page = 1,
): Promise<VehicleLandingData> {
  const response = await api.get<VehicleLandingData>("/api/seo/vehicle", {
    params: { brand, model, year, version, page, pageSize: 12 },
  });
  return response.data;
}
