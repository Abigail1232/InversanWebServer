import api from "../axios";

export type VisitaProd = {
    id_visita?: number,
    id_producto: number,
    duracion_visita: number,
    fecha?: string,
    id_sucursal?: number
};

export async function crearVisita(data: VisitaProd): Promise<VisitaProd | null> {
    try {
        const res = await api.post("/api/producto-event", data);
        return res.data;
    } catch (error) {
        console.error("Error creando visita:", error);
        return null;
    }
}
