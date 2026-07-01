import axios from '../axios';
import { safeLocalStorage } from '../../utils/storage';

// Login
export async function login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await axios.post("/api/auth/login", {
      Nameusuario: username,
      clave: password,
    },
    {
      withCredentials: true 
    });

    if (res.data?.success) {
      if (res.data.token) {
        safeLocalStorage.setItem("token", res.data.token);
      }
      return { success: true };
    }

    return { success: false, message: res.data?.error || "Error al iniciar sesión" };
  } catch (error: any) {
    console.error(error);
    const message = error.response?.data?.error || "Error al conectar con el servidor";
    return { success: false, message };
  }
}