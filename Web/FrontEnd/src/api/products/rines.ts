import api from "../axios";

export type GetRinesParams = {
  id_categoria?: number;
  numero_rin?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
};

export async function getRines(params?: GetRinesParams): Promise<number[]> {
  const res = await api.get<ApiResponse<number[]>>("/api/products/rines", { params });
  return res.data.data;
}

export type GetFiltrosLlantasParams = {
  id_categoria?: number;
  id_sucursal?: number;
  rin?: number;
  alto_rin?: number;
  ancho_rin?: number;
};

export type ProductoFiltroLlanta = {
  id_producto: number;
  marca: string;
  nombre_producto: string;
  precio_detalle: number;
  rin: number;
  alto_rin: number;
  ancho_rin: number;
  id_categoria: number;
  imageUrl: string;
  stock_total: number;
};

export type FiltrosLlantasResponse = {
  success: boolean;
  filtros: {
    rines: number[];
    altos_rin: number[];
    anchos_rin: number[];
  };
  productos: ProductoFiltroLlanta[];
};

export async function getFiltrosLlantas(
  params?: GetFiltrosLlantasParams
): Promise<FiltrosLlantasResponse> {
  const res = await api.get<FiltrosLlantasResponse>("/api/products/filtro_rines", {
    params,
  });

  return res.data;
}