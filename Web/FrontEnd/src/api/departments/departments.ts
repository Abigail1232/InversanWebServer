import axios from "../axios";
import type { Departamento, Municipio } from "./types";


export const fetchMunicipios = async (): Promise<Municipio[]> => {
  try {
    const response = await axios.get<Municipio[]>("api/departments/municipalities");
    return response.data;
  } catch (error) {
    console.error("Error fetching municipios:", error);
    return [];
  }
};


export const fetchMunicipiosByDepartamento = async (idDepartamento: number): Promise<Municipio[]> => {
  try {
    const response = await axios.get<Municipio[]>(`api/departments/${idDepartamento}/municipalities`);
    return response.data;
  } catch (error) {
    console.error("Error fetching municipios por departamento:", error);
    return [];
  }
};

export const fetchDepartamentos = async (): Promise<Departamento[]> => {
  try {
    const response = await axios.get<Departamento[]>("api/departments");
    return response.data;
  } catch (error) {
    console.error("Error fetching departamentos:", error);
    return [];
  }
};
