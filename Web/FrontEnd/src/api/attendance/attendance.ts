import api from "../axios";

export type AttendanceBranch = {
  id_sucursal: number;
  nombre: string;
  activo: boolean;
};

export type AttendanceContext = {
  canAdministrarAsistencia: boolean;
  canReportesAsistencia: boolean;
  defaultBranchId: number | null;
  sucursales: AttendanceBranch[];
};

export type AttendanceEmployeeDay = {
  id_usuario: number;
  usuario: string;
  nombre: string;
  activo: boolean;
  id_asistencia: number | null;
  hora_entrada: string;
  horas_faltadas: number;
  categoria: string;
  observacion: string;
};

export type AttendanceDayResponse = {
  fecha: string;
  id_sucursal: number;
  empleados: AttendanceEmployeeDay[];
};

export type AttendanceSaveItem = {
  id_usuario: number;
  hora_entrada: string;
  observacion?: string | null;
};

export type AttendanceReportRow = {
  id_usuario: number;
  usuario: string;
  nombre: string;
  sucursal: string;
  rango_7_31_7_40: number;
  rango_7_41_7_50: number;
  despues_7_50: number;
  horas_faltadas: number;
  registros: number;
};

export type AttendanceRecord = {
  id_asistencia: number;
  id_usuario: number;
  id_sucursal: number;
  fecha: string;
  hora_entrada: string;
  horas_faltadas: number;
  categoria: string;
  observacion?: string | null;
  usuario?: {
    id_usuario: number;
    nombre: string;
    usuario: string;
  };
  sucursal?: {
    id_sucursal: number;
    nombre: string;
  };
};

export async function getAttendanceContext(): Promise<AttendanceContext> {
  const response = await api.get<AttendanceContext>("/api/asistencias/context");
  return response.data;
}

export async function getAttendanceDay(params: {
  id_sucursal: number;
  fecha: string;
}): Promise<AttendanceDayResponse> {
  const response = await api.get<AttendanceDayResponse>("/api/asistencias/dia", {
    params,
  });
  return response.data;
}

export async function saveAttendance(payload: {
  id_sucursal: number;
  fecha: string;
  asistencias: AttendanceSaveItem[];
}) {
  const response = await api.post("/api/asistencias/marcar", payload);
  return response.data;
}

export async function getAttendanceReports(params: {
  id_sucursal: number;
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<AttendanceReportRow[]> {
  const response = await api.get<AttendanceReportRow[]>("/api/asistencias/reportes", {
    params,
  });
  return response.data;
}

export async function getUserAttendanceRecords(params: {
  id_usuario: number;
  id_sucursal: number;
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<AttendanceRecord[]> {
  const { id_usuario, ...query } = params;
  const response = await api.get<AttendanceRecord[]>(
    `/api/asistencias/reportes/${id_usuario}/registros`,
    { params: query },
  );
  return response.data;
}

export async function updateAttendanceRecord(params: {
  id_asistencia: number;
  hora_entrada: string;
  observacion?: string | null;
}): Promise<AttendanceRecord> {
  const { id_asistencia, ...payload } = params;
  const response = await api.put<{ data: AttendanceRecord }>(
    `/api/asistencias/${id_asistencia}`,
    payload,
  );
  return response.data.data;
}
