import api from "../axios";

export type MarcaDiseno = {
  id_marca: number;
  nombre: string;
  activo?: boolean;
};

export type Diseno = {
  id_diseno: number;
  nombre: string;
  imagen_url?: string | null;
  descripcion?: string | null;
  activo: boolean;
  id_marca: number;
  marca?: MarcaDiseno;
  cantidad_productos?: number;
  productCount?: number;
};

export type ProductoPorDiseno = {
  id: number;
  id_producto: number;
  name: string;
  nombre: string;
  image?: string | null;
  imagen_url?: string | null;
  brand: string;
  marca: string;
  design: string;
  diseno: string;
  medida: string;
  price: number;
  precio: number;
  status: "Activo" | "Inactivo";
  estado: boolean;
};

export type CrearDiseno = {
  nombre: string;
  descripcion?: string;
  id_marca: number;
  imagen?: File | null;
  activo?: boolean;
};

export type ModificarDiseno = {
  id_diseno: number;
  nombre: string;
  descripcion?: string;
  id_marca: number;
  imagen?: File | null;
  activo?: boolean;
};

export type GetDisenosParams = {
  search?: string;
  id_marca?: number | string;
  estado?: "Activa" | "Inactiva" | "Activo" | "Inactivo" | "";
  activo?: boolean | string;
  page?: number;
  pageSize?: number;
};

export type GetProductosPorDisenoParams = {
  search?: string;
  estado?: "Todos los Estados" | "Activo" | "Inactivo" | "";
  medida?: string;
  page?: number;
  pageSize?: number;
};

export type PaginationResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type GetDisenosResponse = {
  success: boolean;
  data: Diseno[];
  total: number;
  pagination?: PaginationResponse;
  message?: string;
};

export type GetDisenoByIdResponse = {
  success: boolean;
  data: Diseno;
  message?: string;
};

export type GetProductosPorDisenoResponse = {
  success: boolean;
  diseno: Diseno;
  data: ProductoPorDiseno[];
  total: number;
  pagination?: PaginationResponse;
  message?: string;
};

const createDisenoFormData = (
  payload: CrearDiseno | ModificarDiseno
): FormData => {
  const formData = new FormData();

  formData.append("nombre", payload.nombre);
  formData.append("descripcion", payload.descripcion || "");
  formData.append("id_marca", String(payload.id_marca));
  formData.append("activo", String(payload.activo ?? true));

  if (payload.imagen) {
    formData.append("imagen", payload.imagen);
  }

  return formData;
};

export async function getDisenos(
  params?: GetDisenosParams
): Promise<GetDisenosResponse> {
  const res = await api.get<GetDisenosResponse>("/api/disenos", {
    params,
  });

  return {
    success: res.data.success,
    data: res.data.data || [],
    total: res.data.total || 0,
    pagination: res.data.pagination,
    message: res.data.message,
  };
}

export async function getDisenoById(
  id_diseno: number
): Promise<Diseno | null> {
  try {
    const res = await api.get<GetDisenoByIdResponse>(
      `/api/disenos/${id_diseno}`
    );

    return res.data.data;
  } catch (error) {
    console.error("Error obteniendo diseño:", error);
    return null;
  }
}

export async function getProductosPorDiseno(
  id_diseno: number,
  params?: GetProductosPorDisenoParams
): Promise<GetProductosPorDisenoResponse> {
  const res = await api.get<GetProductosPorDisenoResponse>(
    `/api/disenos/${id_diseno}/productos`,
    {
      params,
    }
  );

  return {
    success: res.data.success,
    diseno: res.data.diseno,
    data: res.data.data || [],
    total: res.data.total || 0,
    pagination: res.data.pagination,
    message: res.data.message,
  };
}

export async function crearDiseno(payload: CrearDiseno): Promise<Diseno> {
  const formData = createDisenoFormData(payload);

  const res = await api.post("/api/disenos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.data || res.data.diseno;
}

export async function modificarDiseno(
  payload: ModificarDiseno
): Promise<Diseno> {
  const formData = createDisenoFormData(payload);

  const res = await api.put(`/api/disenos/${payload.id_diseno}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.data || res.data.diseno;
}

export async function eliminarDiseno(id_diseno: number): Promise<Diseno> {
  const res = await api.patch(`/api/disenos/${id_diseno}/active`);

  return res.data.data || res.data.diseno;
}

export async function toggleDisenoActive(id_diseno: number): Promise<Diseno> {
  return eliminarDiseno(id_diseno);
}