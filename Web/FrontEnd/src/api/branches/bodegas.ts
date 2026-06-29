import axios from "../axios";
import type { Bodega } from "../../types/branch";

export async function getAllBodegas(): Promise<Bodega[]> {
    try {
        const response = await axios.get('/api/bodegas');
        if (!response.data) return [];
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener bodegas:", error);
        return [];
    }
}

export async function createBodega(data: {
    nombre: string,
    id_sucursal: number
}){
    try {
        const response = await axios.post('api/bodegas', {
            nombre: data.nombre,
            id_sucursal: data.id_sucursal
        }, {
            withCredentials: true
        })
        return response.data

    } catch (error) {
        console.error("Error al crear la bodega:", error);
        return null
    }
}

export async function getBodega(id: number): Promise<Bodega | null> {
    try {
        const response = await axios.get(`/api/bodegas/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener bodega:", error);
        return null;
    }
}

export async function updateBodega(id: number, data:{
    nombre: string,
    sucursal: number
}) {
    try {
        const response = await axios.put(`api/bodegas/${id}`, {
            nombre: data.nombre,
            id_sucursal: data.sucursal
        }, {
            withCredentials: true
        })
        return response.data

    } catch (error) {
        console.error("Error al actualizar la bodega:", error);
        return null
    }
}

export async function toggleBodegaStatus(id: number, status: boolean) {
    try {
        const response = await axios.patch(`/api/bodegas/${id}/active`, {
            activo: status
        }, {
            withCredentials: true
        });

        return response.data;
    } catch (error) {
        console.error("Error al actualizar el estado de la bodega:", error);
        return null;
    }
}
