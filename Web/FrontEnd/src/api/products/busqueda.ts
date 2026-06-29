import api from "../axios";

export type BuscarProductosParams = {
  busqueda: string;
  categoria?: string;
  id_categoria?: number | null;
  marca?: string;
  marca_vehiculo?: string;
  model?: string;
  year?: number;
  version?: string;
  rin?: number;
  id_sucursal?: number;
  page?: number;
  pageSize?: number;
};

export async function buscarProductos(params: BuscarProductosParams) {
  try {
    const response = await api.get("/api/products/busqueda-productos", {
      params,
    });

    return response.data;
  } catch (error) {
    console.error("Error buscando productos:", error);
    throw error;
  }
}