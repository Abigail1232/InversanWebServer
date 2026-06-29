import api from "../axios";

export interface Privilegio {
  id_privilegio: number;
  nombre: string;
  descripcion: string;
}

export const getAllPrivilegios = async (): Promise<Privilegio[]> => {
  const { data } = await api.get("/api/privileges");
  return Array.isArray(data) ? data : [];
};

export const getPrivilegiosByRol = async (id: number): Promise<Privilegio[]> => {
  const { data } = await api.get(`/api/privileges/role/${id}`);
  return Array.isArray(data) ? data : [];
};

export const assignPrivilegio = async (
  id_rol: number,
  id_privilegio: number
) => {
  const { data } = await api.post("/api/privileges/assign", {
    id_rol,
    id_privilegio,
  });
  return data;
};

export const removePrivilegio = async (
  id_rol: number,
  id_privilegio: number
) => {
  const { data } = await api.delete("/api/privileges/remove", {
    data: { id_rol, id_privilegio },
  });
  return data;
};

export const createNewPrivilegio = async (
  nombre: string,
  descripcion: string
) => {
  const { data } = await api.post("/api/privileges/create", {
    nombre,
    descripcion,
  });
  return data;
};