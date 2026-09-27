import api from "../axios";
import type { GeolocationReading } from "../../services/geolocation";

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object") return undefined;
  const data = "data" in response ? response.data : undefined;
  if (!data || typeof data !== "object" || !("code" in data) || typeof data.code !== "string") return undefined;
  return data.code;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object") return undefined;
  const data = "data" in response ? response.data : undefined;
  if (!data || typeof data !== "object" || !("error" in data) || typeof data.error !== "string") return undefined;
  return data.error;
}

export function getBiometricApiErrorMessage(error: unknown, fallback = "No se pudo enviar esta foto."): string {
  const code = getApiErrorCode(error);
  if (code === "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED") return "El servicio biométrico todavía no está configurado.";
  if (code === "FACE_SERVICE_UNAVAILABLE") return "El servicio de reconocimiento facial no está disponible.";
  if (code === "FACE_QUALITY_INSUFFICIENT") return "La foto no tiene suficiente calidad. Inténtalo nuevamente.";
  return getApiErrorMessage(error) || fallback;
}

export type AttendanceBranch = {
  id_sucursal: number;
  nombre: string;
  activo: boolean;
};

export type AttendanceContext = {
  canAdministrarAsistencia: boolean;
  canReportesAsistencia: boolean;
  canEditarAsistencia: boolean;
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
  rango_7_31_7_39: number;
  rango_7_40_7_49: number;
  desde_7_50: number;
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

export type MyAttendanceSummary = {
  mes: string;
  horas_faltadas: number;
};

export async function getAttendanceContext(): Promise<AttendanceContext> {
  const response = await api.get<AttendanceContext>("/api/asistencias/context");
  return response.data;
}

export async function getAttendanceDay(params: {
  id_sucursal: number;
}): Promise<AttendanceDayResponse> {
  const response = await api.get<AttendanceDayResponse>("/api/asistencias/dia", {
    params,
  });
  return response.data;
}

export async function saveAttendance(payload: {
  id_sucursal: number;
  asistencias: AttendanceSaveItem[];
}): Promise<{ success: boolean; mensaje: string; fecha: string; data: AttendanceRecord[] }> {
  const response = await api.post<{ success: boolean; mensaje: string; fecha: string; data: AttendanceRecord[] }>(
    "/api/asistencias/marcar",
    payload,
  );
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

export async function getMyAttendanceSummary(params?: {
  mes?: number;
  anio?: number;
}): Promise<MyAttendanceSummary> {
  const response = await api.get<MyAttendanceSummary>("/api/asistencias/me/summary", {
    params,
  });
  return response.data;
}

export async function getMyAttendanceRecords(params: {
  fecha_inicio: string;
  fecha_fin: string;
}): Promise<AttendanceRecord[]> {
  const response = await api.get<AttendanceRecord[]>("/api/asistencias/me", { params });
  return response.data;
}

export type LocationVerification = {
  allowed: boolean;
  code?: string;
  reason?: string;
  branch?: { id: number; nombre: string };
  branches?: Array<{ id: number; nombre: string; locationConfigured: boolean; radiusMeters: number; maxGpsAccuracyMeters: number }>;
  distanceMeters?: number;
  radiusMeters?: number;
  accuracyMeters?: number;
  maxAccuracyMeters?: number;
};

export type CheckinStatus = {
  eligible: boolean;
  code?: string;
  branch?: { id: number; nombre: string; locationConfigured: boolean; radiusMeters: number; maxGpsAccuracyMeters: number };
  branches?: Array<{ id: number; nombre: string; locationConfigured: boolean; radiusMeters: number; maxGpsAccuracyMeters: number }>;
  biometric: { registered: boolean; status: "NOT_REGISTERED" | "PENDING" | "ACTIVE" | "DISABLED" };
  attendance: { alreadyMarkedToday: boolean };
};

export async function getMyCheckinStatus(idSucursal?: number): Promise<CheckinStatus> {
  const response = await api.get<CheckinStatus>("/api/asistencias/me/checkin-status", {
    params: idSucursal ? { id_sucursal: idSucursal } : undefined,
  });
  return response.data;
}

export async function verifyMyAttendanceLocation(reading: GeolocationReading, idSucursal?: number): Promise<LocationVerification> {
  const response = await api.post<LocationVerification>("/api/asistencias/me/location/verify", {
    ...reading,
    ...(idSucursal && { id_sucursal: idSucursal }),
  });
  return response.data;
}

export async function createLivenessChallenge(reading: GeolocationReading, idSucursal?: number): Promise<{ challenge_id: string; actions: string[] }> {
  const response = await api.post<{ challenge_id: string; actions: string[] }>("/api/asistencias/me/biometric/challenge", {
    ...reading,
    ...(idSucursal && { id_sucursal: idSucursal }),
  });
  return response.data;
}

export async function faceCheckIn(payload: {
  challenge_id: string;
  location: GeolocationReading;
  image_base64: string;
  frames: string[];
}): Promise<{ data: AttendanceRecord }> {
  const response = await api.post<{ data: AttendanceRecord }>("/api/asistencias/me/face-checkin", payload);
  return response.data;
}

export async function registerBiometric(idUsuario: number, imageBase64: string): Promise<void> {
  await api.post(`/api/asistencias/biometric/${idUsuario}`, { id_usuario: idUsuario, image_base64: imageBase64 });
}

export async function requestBiometricRegistration(imageBase64: string, idSucursal?: number): Promise<{ id_solicitud: number; status: string }> {
  const response = await api.post<{ id_solicitud: number; status: string }>("/api/asistencias/me/biometric/request", {
    image_base64: imageBase64,
    ...(idSucursal && { id_sucursal: idSucursal }),
  });
  return response.data;
}

export type BiometricRequest = { id_solicitud: number; id_usuario: number; empleado: string; sucursal: string; status: string; created_at: string };

export async function getBiometricRequests(): Promise<BiometricRequest[]> {
  const response = await api.get<BiometricRequest[]>("/api/asistencias/biometric/requests");
  return response.data;
}

export async function reviewBiometricRequest(idSolicitud: number, decision: "approve" | "reject"): Promise<void> {
  await api.post(`/api/asistencias/biometric/requests/${idSolicitud}/${decision}`);
}

export async function deactivateBiometric(idUsuario: number): Promise<void> {
  await api.delete(`/api/asistencias/biometric/${idUsuario}`);
}
