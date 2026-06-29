import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface ProductoOption {
  id_producto: number;
  nombre: string;
  precio_coste: number;
  marca?: {
    nombre: string;
  };
  stock_bodega?: {
    id_bodega: number;
    existencias: number;
    bodega?: {
      id_bodega: number;
      nombre: string;
    };
  }[];
}

export interface BodegaOption {
  id_bodega: number;
  nombre: string;
  sucursal?: {
    nombre: string;
  };
}

export interface IngresoDetalle {
  id_producto: number;
  producto: string;
  cantidad: number;
  accion: string;
}

export interface IngresoItem {
  id_ingreso: number;
  fecha: string;
  proveedor: string;
  id_bodega: number;
  bodega: string;
  productos: number;
  unidades: number;
  responsable: string;
  detalles: IngresoDetalle[];
}

export interface PaginatedIngresos {
  data: IngresoItem[];
  totalRows: number;
  page: number;
  totalPages: number;
}

export interface CreateIngresoProductoPayload {
  id_producto: number;
  cantidad: number;
  costo_unitario: number;
  proveedor: string;
  id_bodega: number;
  accion: "incremento" | "decremento";
}

export interface CreateIngresoPayload {
  observaciones: string;
  productos: CreateIngresoProductoPayload[];
}

export async function getIngresos(page = 1, limit = 6): Promise<PaginatedIngresos> {
  const response = await axios.get(`${API_URL}/api/stock-entries`, {
    params: { page, limit },
    withCredentials: true,
  });

  return response.data;
}

export async function getProductosOptions(): Promise<ProductoOption[]> {
  const response = await axios.get(`${API_URL}/api/stock-entries/products/options`, {
    withCredentials: true,
  });

  return response.data;
}

export async function getBodegasOptions(): Promise<BodegaOption[]> {
  const response = await axios.get(`${API_URL}/api/stock-entries/bodegas/options`, {
    withCredentials: true,
  });

  return response.data;
}

export async function createIngreso(payload: CreateIngresoPayload) {
  const response = await axios.post(`${API_URL}/api/stock-entries/register`, payload, {
    withCredentials: true,
  });

  return response.data;
}