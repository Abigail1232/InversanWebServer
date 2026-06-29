import api from "../axios";
import type { AxiosError } from "axios";

export interface RegisterResult {
  success: boolean;
  errorField?: "username" | "email" | "fullName" | "general";
  errorMessage?: string;
}

export async function register(
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  secondName?: string,
  secondLastName?: string
): Promise<RegisterResult> {
  try {
    const res = await api.post(
      "api/auth/register",
      {
        usuario: username,
        primer_nombre: firstName,
        primer_apellido: lastName,
        correo: email,
        segundo_nombre: secondName,
        segundo_apellido: secondLastName,
        clave: password,
      },
      {
        withCredentials: true,
      }
    );

    if (res.status === 201) {
      return { success: true };
    }

    return { success: false, errorField: "general", errorMessage: "No se pudo registrar el usuario." };
  } catch (err) {
    const error = err as AxiosError<{ error?: string }>;
    const msg = error.response?.data?.error || "Error al registrar usuario";

    if (msg.includes("usuario ya existe")) {
      return {
        success: false,
        errorField: "username",
        errorMessage: "El usuario ya existe.",
      };
    }

    if (msg.includes("correo ya está registrado")) {
      return {
        success: false,
        errorField: "email",
        errorMessage: "El correo ya está registrado.",
      };
    }

    if (msg.includes("debe de tener al menos un nombre y un apellido")) {
      return {
        success: false,
        errorField: "fullName",
        errorMessage: "Debe ingresar al menos un nombre y un apellido.",
      };
    }

    if (msg.toLowerCase().includes("rol")) {
      return {
        success: false,
        errorField: "general",
        errorMessage: "No se pudo crear la cuenta en este momento.",
      };
    }

    return {
      success: false,
      errorField: "general",
      errorMessage: msg,
    };
  }
}
