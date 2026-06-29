import axiosLib from 'axios';
import axios from '../axios';
import { safeLocalStorage } from '../../utils/storage';

export type Privilegio = {
  nombre: string;
};

export type RolPrivilegio = {
  privilegio: Privilegio;
};

export type Rol = {
  id_rol: number;
  nombre: string;
  descripcion: string;
  rol_privilegio?: RolPrivilegio[];
};

export type EmpleadoSucursal = {
  id_sucursal: number;
  sucursal: {
    nombre: string;
  };
};

export type Usuario = {
  id_usuario: number;
  usuario: string;
  correo: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string | null;
  activo: boolean;
  id_rol: number;
  rol?: Rol;
  empleado_sucursal?: EmpleadoSucursal[];
};

export const GUEST_USER: Usuario = {
  id_usuario: 0,
  usuario: 'guest',
  correo: '',
  primer_nombre: 'Invitado',
  segundo_nombre: null,
  primer_apellido: '',
  segundo_apellido: null,
  telefono: null,
  activo: false,
  id_rol: 0,
  rol: { id_rol: 0, nombre: 'Invitado', descripcion: 'Rol de Invitado' },
};

export async function getUserToken(): Promise<Usuario | null> {
  const token = safeLocalStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await axios.get<Usuario | { user?: Usuario }>('/api/users/me', {
      withCredentials: true,
    });

    const payload = response.data as Usuario | { user?: Usuario } | null;
    if (!payload) return null;

    if ("user" in payload && payload.user) return payload.user;
    return payload as Usuario;
  } catch (error: unknown) {
    // 401/403 = usuario no autenticado, es un caso normal
    if (axiosLib.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) return null;
    console.error("Error al obtener el usuario desde el token:", error);
    return null;
  }
}

export async function getUsers(): Promise<Usuario[] | []> {
  try{
    const response = await axios.get('/api/users/');
    if (!response.data) return [];
    return response.data;
  } catch (error) {
    console.error("Error al obtener los usuarios", error);
    return [];
  }
}

export async function changeUserBranch(id_usuario: number, id_sucursal: number) {
  try {
    const response = await axios.put(`/api/users/branch/${id_usuario}`, {
      id_sucursal,
    });
    return response.data;
  } catch (error) {
    console.error("Error al cambiar la sucursal del usuario", error);
    throw error;
  }
}
