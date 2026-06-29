import axios from "../axios";

export interface DashboardStats {
    ok: boolean;
    stats: {
        ventasHoy: number;
        pedidosPendientes: number;
        productosBajoStock: number;
        ventasMes: number;
    };
    graficaLineas: { name: string; total: number }[];
    graficaDona: { marca: string; cantidad: number }[];
    ultimosPedidos: any[]; // Puedes definir una interfaz más detallada si gustas
}

export const getDashboardStats = async (params?: { id_sucursal?: number | string }) => {
    try {
        const response = await axios.get<DashboardStats>("/api/dashboard/stats", {
            params
        });
        return response.data;
    } catch (error) {
        console.error("Error al obtener estadísticas del dashboard:", error);
        throw error;
    }
};