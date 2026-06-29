import api from "../axios";

export type Categoria = {
  id_categoria: number;
  nombre: string;
  imagen_url: string | null;
  activo: boolean;
};

export type CrearCategoria = {
  nombre: string;
  imagen: File;
  activo?: boolean;
};

export type ModificarCategoria = {
  id_categoria: number;
  nombre: string;
  imagen?: File | null;
  activo?: boolean;
};

export async function getCategorias(): Promise<Categoria[]> {
  const res = await api.get("/api/products/categorias");
  return res.data.data;
}

export async function crearCategoria(
  payload: CrearCategoria
): Promise<Categoria> {
  const formData = new FormData();
  formData.append("nombre", payload.nombre);
  formData.append("imagen", payload.imagen);
  formData.append("activo", String(payload.activo ?? true));

  const res = await api.post("/api/products/crear_categoria", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.categoria;
}

export async function modificarCategoria(
  payload: ModificarCategoria
): Promise<Categoria> {
  const formData = new FormData();
  formData.append("nombre", payload.nombre);
  formData.append("activo", String(payload.activo ?? true));

  if (payload.imagen) {
    formData.append("imagen", payload.imagen);
  }

  const res = await api.put(
    `/api/products/modificar_categoria/${payload.id_categoria}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data.categoria;
}

export async function eliminarCategoria(id_categoria: number): Promise<Categoria> {
  const res = await api.patch(`/api/products/eliminar_categoria/${id_categoria}`);
  return res.data.categoria;
}