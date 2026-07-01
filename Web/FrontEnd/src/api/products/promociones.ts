import api from "../axios";
import type { Promotion } from "../promotions/promotion";

// GET /api/products/promociones → retorna Promotion[] (array directo, sin wrapper)
export async function getProductosPromociones(
  id_sucursal?: number
): Promise<Promotion[]> {
  try {
    const res = await api.get("/api/products/promociones", {
      params: {
        ...(id_sucursal !== undefined ? { id_sucursal } : {}),
      },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}