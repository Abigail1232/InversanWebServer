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

// Bug fix: was calling /api/products/productos-promociones which does not exist.
// The correct backend endpoint is /api/products/promociones (list promotions)
// or /api/products/promocion-productos/:id (products for a specific promotion).
export async function getProductosPromociones(
  page = 1,
  id_sucursal?: number
): Promise<ProductosPromocionesResponse> {
  const res = await api.get("/api/products/promociones", {
    params: {
      page,
      ...(id_sucursal !== undefined ? { id_sucursal } : {}),
    },
  });

  return res.data;
}