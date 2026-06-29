import api from "../axios";

export type ProductosPromocionesResponse = {
  success: boolean;
  data: any[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalProductos: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export async function getProductosPromociones(
  page = 1,
  id_sucursal?: number
): Promise<ProductosPromocionesResponse> {
  const res = await api.get("/api/products/productos-promociones", {
    params: {
      page,
      ...(id_sucursal !== undefined ? { id_sucursal } : {}),
    },
  });

  return res.data;
}