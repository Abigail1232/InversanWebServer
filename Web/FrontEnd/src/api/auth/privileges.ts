import axiosLib from 'axios';
import axios from "../axios";
import { safeLocalStorage } from "../../utils/storage";
const USER_URL = '/api/users';

export type Privilegio = {
  id_privilegio: number;
  nombre: string;
  descripcion: string;
};

export async function getPrivilegesUser() : Promise<Privilegio[]>{
    const token = safeLocalStorage.getItem("token");
    if (!token) return [];

    try {
        const response = await axios.get(`${USER_URL}/privileges`,{withCredentials: true, });
        return response.data;
    } catch (error: unknown) {
        // 401/403 = usuario no autenticado, es un caso normal — no loguear como error
        if (axiosLib.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
            return [];
        }
        console.error(error);
        return [];
    }
    
};
