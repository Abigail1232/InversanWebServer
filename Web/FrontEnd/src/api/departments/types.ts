export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
}

export interface Municipio {
  id_municipio: number;
  nombre: string;
  id_departamento: number;
}
