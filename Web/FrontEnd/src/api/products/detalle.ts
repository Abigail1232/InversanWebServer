import api from "../axios";

export type ProductoDetalle = {
  id_producto: number;
  nombre: string;
  precio_detalle: number;
  rin: number;
  ancho: number;
  profundidad: number;
  indice_carga: number;
  indice_velocidad: number;
  presion_maxima: number;
  categoria: {
    id_categoria: number;
    nombre: string;
  };
  marca: {
    id_marca: number;
    nombre: string;
  };
  modelo: {
    id_modelo: number;
    nombre: string;
  };
};



export async function getDetalleProducto(id: number): Promise<ProductoDetalle> {
  const res = await api.get(
    `/api/products/detalle-producto/${id}`
  );
  return res.data.data;
}