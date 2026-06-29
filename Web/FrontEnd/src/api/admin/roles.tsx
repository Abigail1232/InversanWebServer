import axios from "../axios";

export interface Role {
  id_rol: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export async function fetchRoles(): Promise<Role[]> {
  try {
    const response = await axios.get("/api/roles");
    // Si el backend envía res.json(roles), los datos están directamente en response.data
    return Array.isArray(response.data)
      ? response.data
      : response.data.roles || [];
  } catch (error) {
    console.error("Error al obtener los roles:", error);
    return [];
  }
}

export async function createRole(
  nombre: string,
  descripcion: string,
): Promise<Role> {
  try {
    const response = await axios.post("/api/roles/create/", {
      nombre,
      descripcion,
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear el rol:", error);
    throw error;
  }
}

export async function updateRole(
  id_rol: number,
  nombre: string,
  descripcion: string,
): Promise<Role> {
  const response = await axios.patch(`/api/roles/update/${id_rol}`, {
    nombre,
    descripcion,
  });
  return response.data;
}

export async function deleteRole(id_rol: number): Promise<void> {
  try {
    await axios.delete(`/api/roles/delete/${id_rol}`);
  } catch (error) {
    console.error("Error al eliminar el rol:", error);
    throw error;
  }
}

export async function activateRole(id_rol: number): Promise<Role> {
  const response = await axios.patch(`/api/roles/activate/${id_rol}`);
  return response.data;
}

export async function deactivateRole(id_rol: number): Promise<Role> {
  const response = await axios.patch(`/api/roles/deactivate/${id_rol}`);
  return response.data;
}
