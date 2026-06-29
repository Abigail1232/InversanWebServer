import axios from "../axios";

export interface UsuarioAdmin {
    id_usuario: number;
    usuario: string;
    correo: string;
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    id_rol: number;
    activo: boolean;
    rol?: {
        nombre: string;
        rol_privilegio: {
            privilegio: {
                nombre: string;
            };
        }[];
    };
    empleado_sucursal?: {
        id_sucursal: number;
        sucursal?: {
            nombre: string;
        };
    }[];
}

export const buscarUsuariosAdmin = async () => {
    try {
        const response = await axios.get<UsuarioAdmin[]>("/api/users");
        return response.data;
    } catch (error) {
        console.error("Error al buscar usuarios administradores:", error);
        throw error;
    }
};

export const getRepartidores = async (): Promise<UsuarioAdmin[]> => {
    try {
        const response = await axios.get<UsuarioAdmin[]>("/api/users/repartidores");
        return response.data;
    } catch (error) {
        console.error("Error al obtener repartidores:", error);
        throw error;
    }
};
