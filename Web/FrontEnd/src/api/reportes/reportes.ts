import axios from '../axios';

export type TendenciaData = {
  fecha: string;
  total_vistas: number;
  promedio_atencion: number;
};

export type TopProductoData = {
  id_producto: number;
  nombre: string;
  vistas: number;
  porcentaje_vistas?: number;
  tiempo_promedio_segundos?: number;
  ventas: number;
  conversion: number;
  imagen_url?: string | null;
};

export type SinVistasData = {
  id_producto: number;
  nombre: string;
  dias_sin_vista: number;
  tiempo_atencion?: number;
  imagen_url?: string | null;
};

export type ComparativaData = {
  periodo_actual: number;
  periodo_anterior: number;
  variacion_pct: number;
};

export type DashboardAvanzadoData = {
  segmentos: {
    rin: { segmento: string; valor: number }[];
    categoria: { segmento: string; valor: number }[];
    marca: { segmento: string; valor: number }[];
  };
  comportamiento: {
    paginas_por_sesion: number;
    nivel_interaccion: string;
    tiempo_promedio_general: number;
  };
  insights: {
    principal: string;
    lista: string[];
  };
};

export const getTendencia = async (params?: any): Promise<TendenciaData[]> => {
  const response = await axios.get('/api/reportes/tendencia', { params });
  return response.data;
};

export const getTopProductos = async (params?: any): Promise<TopProductoData[]> => {
  const response = await axios.get('/api/reportes/top-productos', { params });
  return response.data;
};

export const getSinVistas = async (params?: any): Promise<SinVistasData[]> => {
  const response = await axios.get('/api/reportes/sin-vistas', { params });
  return response.data;
};

export const getComparativa = async (params?: any): Promise<ComparativaData> => {
  const response = await axios.get('/api/reportes/comparativa', { params });
  return response.data;
};

export const getDashboardAvanzado = async (params?: any): Promise<DashboardAvanzadoData> => {
  const response = await axios.get('/api/reportes/dashboard-avanzado', { params });
  return response.data;
};

export const logBusqueda = async (data: { termino: string, tuvo_resultado: boolean, id_sesion?: string }) => {
  const response = await axios.post('/api/producto-event/busqueda', data);
  return response.data;
};

export const getOportunidades = async (params?: any): Promise<TopProductoData[]> => {
  const response = await axios.get('/api/reportes/oportunidades', { params });
  return response.data;
};
