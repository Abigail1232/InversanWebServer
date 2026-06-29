import axios from "../axios";

export interface Model {
  id: number;
  name: string;
  year: Date;
  active: number;
  brand: string;
  count: number;
  versions?: { id_version: number; nombre: string }[];
}

export interface SaveModelData {
  id?: number;
  brand: string;
  name: string;
  year: number;
  active?: boolean;
  versions?: string[];
}

export interface ToggleStatusData {
  active: boolean;
}

export interface GetModelsFilters {
  active?: boolean | null;
  name?: string | null;
  brand?: string | null;
  page?: number | null;
  pageSize?: number;
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetModelsResponse {
  data: Model[];
  pagination: Pagination;
}

const MODEL_URL = "/api/models";

export async function getModels(
  filters?: GetModelsFilters
): Promise<GetModelsResponse> {
  try {
    const params: any = {};
    if (filters) {
      for (const key in filters) {
        if (
          filters[key as keyof GetModelsFilters] !== null &&
          filters[key as keyof GetModelsFilters] !== undefined
        ) {
          params[key] = filters[key as keyof GetModelsFilters];
        }
      }
    }

    const response = await axios.get(MODEL_URL, { params });
    return response.data as GetModelsResponse;
  } catch (error: any) {
    console.error("Error al obtener modelos:", error);
    throw error;
  }
}
/**
 * Guarda o actualiza un modelo.
 * POST /api/models (si es creación) o POST /api/models/:id (si es edición)
 */
export async function saveModel(data: SaveModelData): Promise<any> {
  try {
    const url = MODEL_URL;

    const response = await axios.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error("Error al guardar el modelo:", error);
    console.error("Status:", error?.response?.status);
    console.error("Data del backend:", error?.response?.data);
    throw error;
  }
}
/**
 * Activa o desactiva un modelo.
 * POST /api/models/:id
 */
export async function toggleModelStatus(
  id: number,
  active: boolean
): Promise<any> {
  try {
    const response = await axios.post(`${MODEL_URL}/active/${id}`, { active });
    return response.data;
  } catch (error: any) {
    console.error("Error al cambiar el estado del modelo:", error);
    throw error;
  }
}

export async function getCarBrands(){
  try {
    const response = await axios.get(`${MODEL_URL}/brand`);
    return response.data;
  } catch (error) {
    console.error("Error aal conseguir las marcas:", error);
    throw error;
  }
}
