import axios from "../axios";
import type { EmpleadoSucursal, Sucursal } from "../../types/branch";

export async function getAllBranches(): Promise<Sucursal[]> {
  try {
    const response = await axios.get('/api/sucursales');
    if (!response.data) return [];
    return response.data;
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return [];
  }
}

export async function getAllActiveBranches(): Promise<Sucursal[]> {
  try {
    const response = await axios.get('/api/sucursales/active');
    if (!response.data) return [];
    return response.data;
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return [];
  }
}

export async function getBranch(id: number): Promise<Sucursal | null> {
  try {
    const response = await axios.get(`/api/sucursales/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener sucursal:", error);
    return null;
  }
}

export const getEmployeeCountForBranch = async (id: number): Promise<number> => {
  try {
    const response = await axios.get(`/api/sucursales/${id}/empleados`);
    return response.data.length;
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    return 0;
  }
};

export const getEmployeesForBranch = async (id: number): Promise<EmpleadoSucursal[]> => {
  try {
    const response = await axios.get(`/api/sucursales/${id}/empleados`);
    return response.data ?? [];
  } catch (error) {
    console.error("Error al obtener la asignación de empleados:", error);
    return [];
  }
};

export async function createBranch(data: {
  name: string,
  manager: number,
  RTN: string,
  city: string,
  state: string,
  location: string,
  lat: number,
  lng: number
}){
  try {
    let departamentoId: number | null = null;
    let municipioId: number | null = null;

    try {
      const depRes = await axios.get(`/api/municipios/departamento/nombre/${data.state}`);
      if (depRes.data && depRes.data.data.id_departamento) {
        departamentoId = depRes.data.data.id_departamento;
      }
    } catch (e) {
      // Departamento no encontrado, se creará
    }
    if (!departamentoId) {
      const newDepRes = await axios.post(
        "/api/municipios/departamento",
        { nombre_departamento: data.state },
        { withCredentials: true }
      );
      departamentoId = newDepRes.data.data.id_departamento;
    }

    try {
      const munRes = await axios.get(`/api/municipios/nombre/${data.city}`);
      if (munRes.data && munRes.data.data.id_municipio) {
        municipioId = munRes.data.data.id_municipio;
      }
    } catch (e) {
      // Municipio no encontrado, se creará
    }
    if (!municipioId) {
      const newMunRes = await axios.post(
        "/api/municipios",
        { nombre: data.city, id_departamento: departamentoId }
      );
      municipioId = newMunRes.data.data.id_municipio;
    }

    const response = await axios.post("/api/sucursales",
      {
        nombre: data.name,
        gerente: data.manager,
        RTN: data.RTN,
        direccion: data.location,
        lat: data.lat,
        lng: data.lng,
        id_municipio: municipioId,
      },
      { withCredentials: true }
    );

    await axios.post(`/api/sucursales/${response.data.data.id_sucursal}/Empleados`,
      {
        id_usuario: data.manager
      }, {
        withCredentials: true
      }
    );

    const bodegaResponse = await axios.post("/api/bodegas",
      {
       nombre:  `Bodega de ${data.name}`,
       id_sucursal: response.data.data.id_sucursal
      }, {
        withCredentials: true
      }
    );

    return {sucursal: response.data, bodega: bodegaResponse.data};
  } catch (error) {
    console.error("Error creando la sucursal:", error);
    return null;
  }
}

export async function toggleBranchStatus(id: number, status: boolean) {
  try {
    const response = await axios.patch(`/api/sucursales/${id}/active`, {
      activo: status
    }, {
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error("Error al desactivar la sucursal: ", error);
    return null
  }
}

export async function updateBranch(id:number, data: {
  name: string,
  manager: number,
  RTN: string,
  city: string,
  state: string,
  location: string,
  lat: number,
  lng: number
}){
  try{
    let departamentoId: number | null = null;
    let municipioId: number | null = null;

    try {
      const depRes = await axios.get(`/api/municipios/departamento/nombre/${data.state}`);
      if (depRes.data && depRes.data.data.id_departamento) {
        departamentoId = depRes.data.data.id_departamento;
      }
    } catch (e) {
      // Departamento no encontrado, se creará
    }

    if (!departamentoId) {
      const newDepRes = await axios.post(
        "/api/municipios/departamento",
        { nombre_departamento: data.state },
        { withCredentials: true }
      );
      departamentoId = newDepRes.data.id_departamento;
    }

    try {
      const munRes = await axios.get(`/api/municipios/nombre/${data.city}`);
      if (munRes.data && munRes.data.data.id_municipio) {
        municipioId = munRes.data.data.id_municipio;
      }
    } catch (e) {
      // Municipio no encontrado, se creará
    }

    if (!municipioId) {
      const newMunRes = await axios.post(
        "/api/municipios",
        { nombre: data.city, id_departamento: departamentoId }
      );
      municipioId = newMunRes.data.id_municipio;
    }

    const response = await axios.put(`/api/sucursales/${id}`,
      {
        nombre: data.name,
        gerente: data.manager,
        RTN: data.RTN,
        direccion: data.location,
        lat: data.lat,
        lng: data.lng,
        id_municipio: municipioId,
      },
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    console.error("Error creando la sucursal:", error);
    return null;
  }
}
