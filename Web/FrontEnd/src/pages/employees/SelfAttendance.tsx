import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Select, Spin, Steps, message } from "antd";
import { getBestCurrentLocation, GeolocationError, type GeolocationReading } from "../../services/geolocation";
import {
  createLivenessChallenge,
  faceCheckIn,
  getApiErrorCode,
  getApiErrorMessage,
  getBiometricApiErrorMessage,
  getMyCheckinStatus,
  requestBiometricRegistration,
  verifyMyAttendanceLocation,
  type CheckinStatus,
  type LocationVerification,
} from "../../api/attendance/attendance";
import FaceCamera, { type FaceCameraHandle } from "../../components/FaceCamera";

const RETRY_DELAY_MS = 900;
const RETRYABLE_FACE_ERRORS = new Set(["FACE_NOT_MATCHED", "LIVENESS_FAILED", "CHALLENGE_EXPIRED", "CHALLENGE_INVALID"]);

export default function SelfAttendance() {
  const cameraRef = useRef<FaceCameraHandle>(null);
  const isProcessingFaceCheckinRef = useRef(false);
  const autoStartBlockedRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);
  const [msg, contextHolder] = message.useMessage();
  const [reading, setReading] = useState<GeolocationReading | null>(null);
  const [challenge, setChallenge] = useState<{ challenge_id: string; actions: string[] } | null>(null);
  const [branchName, setBranchName] = useState("");
  const [status, setStatus] = useState("GPS_WAITING");
  const [result, setResult] = useState<{ fecha: string; hora_entrada: string; categoria: string } | null>(null);
  const [preflight, setPreflight] = useState<CheckinStatus | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(true);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [gpsSearching, setGpsSearching] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<LocationVerification | null>(null);
  const [requestMode, setRequestMode] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [attemptKey, setAttemptKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPreflightLoading(true);
    void getMyCheckinStatus(selectedBranchId)
      .then((data) => {
        if (cancelled) return;
        setPreflight(data);
        if (data.attendance.alreadyMarkedToday) setStatus("ALREADY_MARKED");
        else if (data.biometric.status !== "ACTIVE") setStatus(`BIOMETRIC_${data.biometric.status}`);
        else if (data.code) setStatus(data.code);
        else setStatus("GPS_WAITING");
      })
      .catch(() => {
        if (!cancelled) setStatus("CHECKIN_STATUS_ERROR");
      })
      .finally(() => {
        if (!cancelled) setPreflightLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBranchId]);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
  }, []);

  const start = useCallback(async () => {
    if (gpsSearching || isProcessingFaceCheckinRef.current) return;
    autoStartBlockedRef.current = false;
    setStatus("GPS_WAITING");
    setGpsSearching(true);
    setCurrentAccuracy(null);
    setLocationFeedback(null);
    try {
      const location = await getBestCurrentLocation({
        targetAccuracyMeters: preflight?.branch?.maxGpsAccuracyMeters,
        durationMs: 30000,
        onReading: (nextReading) => setCurrentAccuracy(nextReading.accuracy),
      });
      setCurrentAccuracy(location.accuracy);
      const verified = await verifyMyAttendanceLocation(location, selectedBranchId);
      if (!verified.allowed) {
        setLocationFeedback(verified);
        setStatus(verified.code || verified.reason || "INVALID_LOCATION");
        return;
      }
      const next = await createLivenessChallenge(location, selectedBranchId);
      setReading(location);
      setChallenge(next);
      setBranchName(verified.branch?.nombre || "");
      setStatus("CAMERA_WAITING");
    } catch (error: unknown) {
      if (error instanceof GeolocationError) setStatus(error.code);
      else setStatus(getApiErrorCode(error) || "CHECKIN_STATUS_ERROR");
    } finally {
      setGpsSearching(false);
    }
  }, [gpsSearching, preflight?.branch?.maxGpsAccuracyMeters, selectedBranchId]);

  const scheduleNewAttempt = useCallback(() => {
    autoStartBlockedRef.current = true;
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      autoStartBlockedRef.current = false;
      void start();
    }, RETRY_DELAY_MS);
  }, [start]);

  const submit = useCallback(async (frames: string[]) => {
    if (isProcessingFaceCheckinRef.current || status === "PROCESSING") return;
    if (!challenge || !reading) return;
    if (frames.length < 2) {
      msg.warning("No se pudo capturar evidencia facial suficiente");
      return;
    }
    isProcessingFaceCheckinRef.current = true;
    setStatus("PROCESSING");
    try {
      const response = await faceCheckIn({
        challenge_id: challenge.challenge_id,
        location: reading,
        image_base64: frames[frames.length - 1],
        frames,
      });
      setResult(response.data);
      setStatus("SUCCESS");
    } catch (error: unknown) {
      setChallenge(null);
      setReading(null);
      setAttemptKey((current) => current + 1);
      const code = getApiErrorCode(error);
      if (code) setStatus(code);
      else {
        msg.error(getApiErrorMessage(error) || "No se pudo registrar la asistencia biométrica");
        setStatus("BIOMETRIC_REQUEST_ERROR");
      }
      if (RETRYABLE_FACE_ERRORS.has(code || "")) scheduleNewAttempt();
    } finally {
      isProcessingFaceCheckinRef.current = false;
    }
  }, [challenge, msg, reading, scheduleNewAttempt, status]);

  const canUseAutomaticAttendance = Boolean(preflight?.eligible && preflight.biometric.status === "ACTIVE" && preflight.branch?.locationConfigured);

  useEffect(() => {
    if (!canUseAutomaticAttendance || challenge || reading || gpsSearching || autoStartBlockedRef.current) return;
    if (status !== "GPS_WAITING") return;
    void start();
  }, [canUseAutomaticAttendance, challenge, gpsSearching, reading, start, status]);

  const submitBiometricRequest = async (image: string) => {
    try {
      await requestBiometricRegistration(image, selectedBranchId);
      setRequestMode(false);
      setStatus("BIOMETRIC_PENDING");
      setPreflight((current) => current ? { ...current, biometric: { registered: false, status: "PENDING" }, code: "BIOMETRIC_PENDING" } : current);
    } catch (error: unknown) {
      const code = getApiErrorCode(error);
      if (code === "BIOMETRIC_PENDING") {
        setStatus("BIOMETRIC_PENDING");
        setPreflight((current) => current ? { ...current, biometric: { registered: false, status: "PENDING" }, code: "BIOMETRIC_PENDING" } : current);
        return;
      }
      msg.error(getBiometricApiErrorMessage(error));
      throw error;
    }
  };

  const messageByStatus: Record<string, string> = {
    GPS_WAITING: gpsSearching ? "Buscando una ubicación más precisa..." : "Iniciando cámara...",
    PERMISSION_DENIED: "Debes permitir el acceso a tu ubicación.",
    POSITION_UNAVAILABLE: "Tu dispositivo no pudo determinar la ubicación.",
    TIMEOUT: "No se obtuvo ninguna coordenada. Inténtalo nuevamente.",
    INACCURATE: "No fue posible obtener una ubicación válida.",
    GPS_INACCURATE: "Ubicación encontrada, pero precisión insuficiente.",
    OUTSIDE_GEOFENCE: "Estás fuera del radio permitido de la sucursal.",
    BRANCH_LOCATION_NOT_CONFIGURED: "La ubicación de tu sucursal todavía no está configurada. Contacta a un administrador.",
    BRANCH_NOT_ASSIGNED: "No estás asignado a una sucursal activa.",
    MULTIPLE_BRANCHES_SELECT_REQUIRED: "Selecciona la sucursal donde marcarás asistencia.",
    BIOMETRIC_NOT_REGISTERED: preflight?.biometric.selfEnrollmentEnabled === false
      ? "Tu reconocimiento facial todavía no está configurado. Solicita a un administrador que registre tu rostro."
      : "Configura tu reconocimiento facial antes de marcar asistencia.",
    BIOMETRIC_PENDING: "Tu registro facial está pendiente de aprobación.",
    BIOMETRIC_DISABLED: "Tu reconocimiento facial está deshabilitado. Contacta a un administrador.",
    BIOMETRIC_REENROLLMENT_REQUIRED: "Tu reconocimiento facial necesita actualizarse. Solicita al administrador que registre nuevamente tu rostro.",
    INVALID_LOCATION: "La ubicación obtenida no es válida.",
    UNSUPPORTED: "Tu navegador no permite obtener la ubicación.",
    CHECKIN_STATUS_ERROR: "No se pudo consultar el estado de marcación.",
    ATTENDANCE_ALREADY_REGISTERED: "Tu asistencia de hoy ya fue registrada.",
    CHALLENGE_EXPIRED: "La verificación expiró. Intentando nuevamente...",
    CHALLENGE_INVALID: "La verificación no fue válida. Intentando nuevamente...",
    CAMERA_WAITING: "Coloca tu rostro dentro del marco.",
    PROCESSING: "Verificando identidad...",
    LIVENESS_FAILED: "No se pudo comprobar la prueba de vida. Inténtalo nuevamente.",
    FACE_NOT_MATCHED: "No pudimos verificar tu identidad. Intenta nuevamente.",
    PAYLOAD_TOO_LARGE: "La evidencia biométrica es demasiado grande. Inténtalo nuevamente.",
    BIOMETRIC_REQUEST_ERROR: "No se pudo registrar la asistencia biométrica.",
    ALREADY_MARKED: "Asistencia registrada hoy.",
  };

  const stepCurrent = status === "SUCCESS" ? 2 : ["CAMERA_WAITING", "PROCESSING", "LIVENESS_FAILED", "FACE_NOT_MATCHED"].includes(status) ? 1 : 0;
  const canShowLocationPanel = Boolean(preflight?.eligible && preflight.branch && !challenge && status !== "SUCCESS" && status !== "ALREADY_MARKED");
  const requiredAccuracy = locationFeedback?.maxAccuracyMeters ?? preflight?.branch?.maxGpsAccuracyMeters;
  const reportedAccuracy = locationFeedback?.accuracyMeters ?? currentAccuracy;
  const gpsInaccurateDescription = status === "GPS_INACCURATE" ? (
    <div className="space-y-3">
      <div>
        La ubicación fue encontrada, pero su precisión actual es{" "}
        <strong>{reportedAccuracy !== null && reportedAccuracy !== undefined ? `${Math.round(reportedAccuracy)} m` : "No disponible"}</strong>.
        {" "}Esta sucursal requiere{" "}
        <strong>{requiredAccuracy !== null && requiredAccuracy !== undefined ? `${Math.round(requiredAccuracy)} m` : "la configurada"}</strong>{" "}
        o mejor.
      </div>
      <Button size="small" onClick={() => void start()}>Intentar nuevamente</Button>
    </div>
  ) : undefined;

  return (
    <div className="min-h-screen bg-[#F3F6FA] px-4 py-8">
      {contextHolder}
      <div className="mx-auto max-w-3xl space-y-5">
        <Card title="Marcar mi asistencia" loading={preflightLoading}>
          <Steps current={stepCurrent} items={[{ title: "Ubicación" }, { title: "Identidad" }, { title: "Confirmación" }]} />
          <div className="mt-6 space-y-4">
            {preflight?.branches?.length ? (
              <Select
                className="w-full"
                placeholder="Selecciona sucursal"
                value={selectedBranchId}
                options={preflight.branches.map((branch) => ({ value: branch.id, label: branch.nombre }))}
                onChange={(value) => {
                  setSelectedBranchId(value);
                  setChallenge(null);
                  setReading(null);
                  setAttemptKey((current) => current + 1);
                  autoStartBlockedRef.current = false;
                  setStatus("GPS_WAITING");
                }}
              />
            ) : null}
            {status !== "SUCCESS" && <Alert type={status === "ALREADY_MARKED" ? "success" : status.includes("FAILED") || status.includes("MATCHED") || status.includes("OUTSIDE") || status.includes("NOT_CONFIGURED") || status.includes("NOT_REGISTERED") || status.includes("PENDING") || status.includes("ASSIGNED") || status === "GPS_INACCURATE" ? "warning" : "info"} showIcon title={messageByStatus[status] || "Iniciando verificación..."} description={gpsInaccurateDescription} />}
            {status === "SUCCESS" && result && <Alert type="success" showIcon title="Asistencia marcada correctamente" description={`${result.fecha} a las ${result.hora_entrada} - ${branchName} - ${result.categoria}`} />}
            {preflight?.biometric.status === "NOT_REGISTERED" && !requestMode && (
              preflight.biometric.selfEnrollmentEnabled === false
                ? <p className="text-sm text-slate-600">Tu reconocimiento facial todavía no está configurado. Solicita a un administrador que registre tu rostro.</p>
                : <><p className="text-sm text-slate-600">Todavía no tienes un rostro registrado.</p><Button type="primary" onClick={() => setRequestMode(true)}>Configurar mi rostro</Button></>
            )}
            {requestMode && <FaceCamera mode="enrollment" ref={cameraRef} onEnrollmentConfirm={submitBiometricRequest} />}
            {preflight?.biometric.status === "ACTIVE" && preflight.branch && !preflight.branch.locationConfigured && <p className="text-sm text-slate-600">No hay una ubicación GPS registrada para esta sucursal. Comunícate con el encargado para configurarla.</p>}
            {canShowLocationPanel && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Sucursal: <strong>{preflight?.branch?.nombre}</strong><br />Radio permitido: {preflight?.branch?.radiusMeters} m<br />Precisión requerida: {preflight?.branch?.maxGpsAccuracyMeters} m<br />{currentAccuracy !== null && <>Mejor precisión encontrada: {Math.round(currentAccuracy)} m<br /></>}{gpsSearching ? <span className="inline-flex items-center gap-2 pt-2"><Spin size="small" /> Buscando una señal más precisa...</span> : null}</div>}
            {canUseAutomaticAttendance && status !== "SUCCESS" && !requestMode && (
              <FaceCamera
                key={attemptKey}
                ref={cameraRef}
                mode="attendance-auto"
                autoCaptureEnabled={status === "CAMERA_WAITING" && Boolean(challenge && reading) && !isProcessingFaceCheckinRef.current}
                instruction={
                  status === "GPS_WAITING" || gpsSearching
                    ? "Iniciando cámara..."
                    : status === "PROCESSING"
                      ? "Verificando identidad..."
                      : undefined
                }
                onAutoCapture={(frames) => void submit(frames)}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
