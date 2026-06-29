import axios from "../axios";

export interface ProductoFactura {
  id_producto: number;
  nombre: string;
  lonas: number;
  profundidad: number;
  rin: number;
  marca?: string | { nombre: string };
}

export interface FacturaDetalle {
  id_factura_detalle: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  total: number;
  producto: ProductoFactura;
}

export interface ClienteVenta {
  nombre: string;
  correo: string;
  telefono: string;
  tipo: string;
}

export interface Factura {
  id_factura: number;
  numero_factura: string;
  fecha_emision: string;
  subtotal: number;
  descuento: number;
  iva: number;
  costo_envio: number;
  total: number;
  tipo_de_pago: string;
  estado: string;
  sucursal?: string;
  cliente: ClienteVenta | null;
  repartidor: string | null;
  factura_detalle: FacturaDetalle[];
}

export interface FiltroFacturasParams {
  fecha_inicio?: string;
  fecha_fin?: string;
  metodo_pago?: string;
  marca?: string;
  sucursal?: string;
  tipo_cliente?: string;
  ancho?: string | number;
  alto?: string | number;
  rin?: string | number;
  page?: number;
  limit?: number;
}

export interface FacturasResponse {
  ok: boolean;
  page: number;
  limit: number;
  total_registros: number;
  total_paginas: number;
  data: Factura[];
}

export interface CantidadVentasResponse {
  ok: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas_rango: number;
  ventas_dia_actual: number;
}

export const getFacturas = async (
  params?: FiltroFacturasParams
): Promise<FacturasResponse> => {
  const response = await axios.get("/api/factura/filtrar_facturas", { params });
  return response.data;
};

export const getCantidadVentas = async (params: {
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<CantidadVentasResponse> => {
  const response = await axios.get("/api/factura/cantidad_ventas", { params });
  return response.data;
};
