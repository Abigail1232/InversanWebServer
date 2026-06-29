import axios from "../axios"; 

export type Promocion = {
  id_promocion: number;
  titulo: string;
  descripcion: string | null;
  banner_url: string | null;
  fecha_inicio: string;
  fecha_finalizacion: string;
  productos_promocion?: any[]; // Opcional, para el detalle
};

export type PromocionesResponse = {
  ok: boolean;
  promociones: Promocion[];
};

export type PromocionDetalleResponse = {
  ok: boolean;
  promocion: Promocion;
};

// Obtener todas las promociones
async function getPromociones(search: string = ""): Promise<PromocionesResponse> {
  try {
    const response = await axios.get(`/api/admin/promociones?search=${search}`);
    return response.data;
  } catch (error) {
    return { ok: false, promociones: [] };
  }
}

// Obtener detalle de una promoción
async function getPromocionDetalle(id: number): Promise<PromocionDetalleResponse | null> {
  try {
    const response = await axios.get(`/api/admin/promociones/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

async function crearPromocion(formData: FormData): Promise<{ ok: boolean; msg: string }> {
  try {
    const response = await axios.post(`/api/admin/promociones`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    return { 
      ok: false, 
      msg: error.response?.data?.msg || "Error al crear la promoción" 
    };
  }
}

// Editar promoción
async function editarPromocion(id: number, formData: FormData): Promise<{ ok: boolean; msg: string }> {
  try {
    const response = await axios.put(`/api/admin/promociones/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    return { 
      ok: false, 
      msg: error.response?.data?.msg || "Error al editar la promoción" 
    };
  }
}

// Eliminar promoción
async function eliminarPromocion(id: number): Promise<boolean> {
  try {
    const response = await axios.delete(`/api/admin/promociones/${id}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function actualizarConfigVisualizacion(
  id: number,
  mostrarPorcentaje: boolean
) {
  try {
    const response = await axios.put(`/api/admin/promociones/${id}/config-visualizacion`,
      {
        mostrar_precio_porcentaje: mostrarPorcentaje,
        mostrar_precio_tachado: !mostrarPorcentaje,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    throw error;
  }
}

export {
  getPromociones,
  getPromocionDetalle,
  crearPromocion,
  editarPromocion,
  eliminarPromocion,
  actualizarConfigVisualizacion
};