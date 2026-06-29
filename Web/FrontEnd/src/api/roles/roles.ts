import api from '../axios';

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

export const getAllRoles = async (): Promise<Rol[]> => {
  const response = await api.get<Rol[]>('/api/roles');
  return response.data;
};