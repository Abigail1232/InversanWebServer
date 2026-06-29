import api from "../axios";

export type CreateSuggestionPayload = {
  titulo: string;
  tipo: string;        // "queja" | "idea" | "mejora" (o el string que uses)
  descripcion: string;
};

export type Sugerencia = {
  id_sugerencia: number;
  id_usuario: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  usuario?: {
    usuario: string;
  };
};

export async function createSuggestion(payload: CreateSuggestionPayload) {
  const res = await api.post("/api/suggestions", payload);
  return res.data;
}

export async function getAllSuggestions(): Promise<Sugerencia[]> {
  const res = await api.get("/api/suggestions");
  return res.data;
}