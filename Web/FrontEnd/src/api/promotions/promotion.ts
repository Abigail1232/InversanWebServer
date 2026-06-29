import type { RelatedProduct } from "../../types/product";
import axios from "../axios";

const PROMO_URL = "/api/products";

export type Promotion = {
    id_promocion : number;
    banner_url: string | null;
    titulo : string;
    descripcion: string;
    fecha_inicio : Date;
    fecha_finalizacion : Date;
    mostrar_precio_porcentaje: boolean;
    mostrar_precio_tachado: boolean;
}

export type PaginationMetadata = {
    currentPage: number;
    pageSize: number;
    totalProductos: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

export type PromotionResponse = {
    promocion : Promotion;
    productos: RelatedProduct[];
    pagination?: PaginationMetadata;
}

export const PAGE_SIZE = 8;

export async function getPromotions() : Promise<Promotion[]>{
    try {
        const response = await axios.get(`${PROMO_URL}/promociones`);
        if (response.status !== 200) return []; 
        return response.data;
    } catch (error) {
        return [];
    }
}

export async function getProductsFromPromotion(
    id_promo: number,
    id_branch?: number,
    page = 1,
    pageSize = PAGE_SIZE
): Promise<PromotionResponse | null> {
  try {
    const params = new URLSearchParams();
    if (id_branch && id_branch > 0) {
      params.append('id_sucursal', String(id_branch));
    }
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const res = await axios.get(
      `${PROMO_URL}/promocion-productos/${id_promo}?${params.toString()}`
    );

    if (res.status !== 200) return null;

    return res.data as PromotionResponse;
  } catch (error) {
    return null;
  }
}
