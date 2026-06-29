import api from "../axios";

export type Marca = {
  id_marca: number;
  nombre: string;
  logo_url?: string | null;
  banner_url?: string | null;
  imagen_url?: string | null;
  cantidad_productos?: number;
  activo: boolean;
};

export type CrearMarca = {
  nombre: string;
  logo: File;
  banner: File;
  activo?: boolean;
};

export type ModificarMarca = {
  id_marca: number;
  nombre: string;
  logo?: File | null;
  banner?: File | null;
  activo?: boolean;
};

export type ProductoPorMarca = {
  id_producto: number;
  nombre: string;
  lonas: number;
  rin: number;
  profundidad: number;
  indice_de_carga: number;
  presion_maxima: number;
  indice_velocidad: number;
  precio_detalle: number;
  precio_mayoreo: number;
  precio_coste: number;
  descripcion: string | null;
  id_marca: number;
  id_categoria: number;
  estado: boolean;
  alto_rin: number;
  ancho_rin: number;
  version: string | null;
  imagen_3d: string | null;
  imagen_url?: string | null;
};

export async function getMarcas(): Promise<Marca[]> {
  const res = await api.get("/api/marcas", {
    params: {
      incluir_inactivas: true,
    },
  });

  return res.data.data;
}

export async function crearMarca(payload: CrearMarca): Promise<Marca> {
  const formData = new FormData();

  formData.append("nombre", payload.nombre);
  formData.append("logo", payload.logo);
  formData.append("banner", payload.banner);
  formData.append("activo", String(payload.activo ?? true));

  const res = await api.post("/api/marcas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.marca;
}

export async function modificarMarca(payload: ModificarMarca): Promise<Marca> {
  const formData = new FormData();

  formData.append("nombre", payload.nombre);
  formData.append("activo", String(payload.activo ?? true));

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  if (payload.banner) {
    formData.append("banner", payload.banner);
  }

  const res = await api.put(`/api/marcas/${payload.id_marca}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.marca;
}

export async function eliminarMarca(id_marca: number): Promise<Marca> {
  const res = await api.patch(`/api/marcas/${id_marca}/active`);
  return res.data.marca;
}

export async function getProductosPorMarca(
  id_marca: number
): Promise<ProductoPorMarca[]> {
  const res = await api.get(`/api/marcas/${id_marca}/productos`);
  return res.data.data;
}
