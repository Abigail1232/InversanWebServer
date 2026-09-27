import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Alert, Button, Spin } from "antd";

const LANDMARKER_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const LANDMARKER_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export const FACE_MIN_SIZE_RATIO = 0.25;
export const FACE_MAX_SIZE_RATIO = 0.68;
export const CENTER_TOLERANCE = 0.16;
export const STABILITY_DURATION_MS = 1200;
export const FACE_CAPTURE_MAX_WIDTH = 720;
export const FACE_CAPTURE_JPEG_QUALITY = 0.76;
const ANALYSIS_INTERVAL_MS = 140;

export type FaceCameraMode = "enrollment" | "liveness";
export type FacePosition = "NO_FACE" | "MULTIPLE_FACES" | "TOO_FAR" | "TOO_CLOSE" | "MOVE_LEFT" | "MOVE_RIGHT" | "MOVE_UP" | "MOVE_DOWN" | "GOOD_POSITION" | "HOLD_STILL" | "CAPTURED";
export type FaceCameraHandle = { capture: () => string | null };

type Props = {
  mode?: FaceCameraMode;
  instruction?: string;
  onError?: (message: string) => void;
  autoCapture?: boolean;
  onAutoCapture?: () => void;
  onEnrollmentConfirm?: (image: string) => Promise<void>;
};

const positionMessages: Record<FacePosition, string> = {
  NO_FACE: "No encontramos tu rostro.",
  MULTIPLE_FACES: "Debe aparecer solamente una persona en la cámara.",
  TOO_FAR: "Acércate un poco a la cámara.",
  TOO_CLOSE: "Aléjate un poco de la cámara.",
  MOVE_LEFT: "Muévete un poco hacia la izquierda.",
  MOVE_RIGHT: "Muévete un poco hacia la derecha.",
  MOVE_UP: "Sube ligeramente el rostro.",
  MOVE_DOWN: "Baja ligeramente el rostro.",
  GOOD_POSITION: "Perfecto. Mantente quieto.",
  HOLD_STILL: "Perfecto. Mantente quieto...",
  CAPTURED: "Foto capturada.",
};

const FaceCamera = forwardRef<FaceCameraHandle, Props>(function FaceCamera({ mode = "liveness", instruction, onError, autoCapture = false, onAutoCapture, onEnrollmentConfirm }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const lastAnalysisRef = useRef(0);
  const stableSinceRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<FacePosition>("NO_FACE");
  const [preview, setPreview] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const shouldAnalyze = mode === "enrollment" || autoCapture;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureCurrentFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const scale = Math.min(1, FACE_CAPTURE_MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", FACE_CAPTURE_JPEG_QUALITY);
  }, []);

  useImperativeHandle(ref, () => ({ capture: captureCurrentFrame }), [captureCurrentFrame]);

  const openCamera = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no permite usar la cámara.");
      setLoading(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch {
      const message = "No se pudo acceder a la cámara. Revisa el permiso del navegador.";
      setError(message);
      onError?.(message);
      setLoading(false);
    }
  }, [onError]);

  const captureEnrollmentPreview = useCallback(() => {
    const image = captureCurrentFrame();
    if (!image) return;
    setPosition("CAPTURED");
    setPreview(image);
    setCountdown(null);
    stopStream();
  }, [captureCurrentFrame, stopStream]);

  useEffect(() => {
    let mounted = true;
    void openCamera();
    if (!shouldAnalyze) return () => {
      mounted = false;
      stopStream();
    };

    void (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(LANDMARKER_WASM);
        if (!mounted) return;
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: LANDMARKER_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 2,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      } catch {
        if (mounted) setError("No se pudo activar la guía facial. Puedes intentar nuevamente.");
      }
    })();

    return () => {
      mounted = false;
      stopStream();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [openCamera, shouldAnalyze, stopStream]);

  useEffect(() => {
    if (!shouldAnalyze || preview) return undefined;
    const analyze = (now: number) => {
      analysisFrameRef.current = window.requestAnimationFrame(analyze);
      if (now - lastAnalysisRef.current < ANALYSIS_INTERVAL_MS) return;
      lastAnalysisRef.current = now;
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2 || !video.videoWidth) return;
      const result = landmarker.detectForVideo(video, now);
      if (result.faceLandmarks.length !== 1) {
        stableSinceRef.current = null;
        setPosition(result.faceLandmarks.length > 1 ? "MULTIPLE_FACES" : "NO_FACE");
        return;
      }
      const landmarks = result.faceLandmarks[0];
      const xs = landmarks.map((point) => point.x);
      const ys = landmarks.map((point) => point.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const height = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      let nextPosition: FacePosition = "GOOD_POSITION";
      if (height < FACE_MIN_SIZE_RATIO) nextPosition = "TOO_FAR";
      else if (height > FACE_MAX_SIZE_RATIO) nextPosition = "TOO_CLOSE";
      else if (centerX < 0.5 - CENTER_TOLERANCE) nextPosition = "MOVE_RIGHT";
      else if (centerX > 0.5 + CENTER_TOLERANCE) nextPosition = "MOVE_LEFT";
      else if (centerY < 0.5 - CENTER_TOLERANCE) nextPosition = "MOVE_DOWN";
      else if (centerY > 0.5 + CENTER_TOLERANCE) nextPosition = "MOVE_UP";
      if (nextPosition !== "GOOD_POSITION") {
        stableSinceRef.current = null;
        setCountdown(null);
        setPosition(nextPosition);
        return;
      }
      const stableSince = stableSinceRef.current ?? now;
      stableSinceRef.current = stableSince;
      setPosition("HOLD_STILL");
      const elapsed = now - stableSince;
      if (elapsed >= STABILITY_DURATION_MS) {
        if (mode === "enrollment") captureEnrollmentPreview();
        else onAutoCapture?.();
      }
      else setCountdown(Math.max(1, Math.ceil((STABILITY_DURATION_MS - elapsed) / 400)));
    };
    analysisFrameRef.current = window.requestAnimationFrame(analyze);
    return () => {
      if (analysisFrameRef.current !== null) window.cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    };
  }, [captureEnrollmentPreview, mode, onAutoCapture, preview, shouldAnalyze]);

  const handleRetake = () => {
    setPreview(null);
    setError("");
    setPosition("NO_FACE");
    stableSinceRef.current = null;
    void openCamera();
  };

  const handleConfirm = async () => {
    if (!preview || !onEnrollmentConfirm) return;
    setConfirming(true);
    setError("");
    try {
      await onEnrollmentConfirm(preview);
    } catch {
      setError("No se pudo enviar esta foto.");
    } finally {
      setConfirming(false);
    }
  };

  const accent = position === "HOLD_STILL" || position === "GOOD_POSITION" ? "border-emerald-400" : position === "TOO_FAR" || position === "TOO_CLOSE" ? "border-amber-300" : "border-rose-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      {preview ? (
        <div className="space-y-3 p-4">
          <p className="text-center text-sm font-semibold text-white">¿Te ves bien en esta foto?</p>
          {error && <Alert type="error" showIcon title={error} />}
          <img src={preview} alt="Vista previa del rostro capturado" className="mx-auto aspect-video w-full rounded-xl object-cover" />
          {mode === "enrollment" && <div className="flex flex-wrap justify-center gap-2">{error ? <><Button type="primary" loading={confirming} onClick={() => void handleConfirm()}>Intentar enviar nuevamente</Button><Button onClick={handleRetake}>Tomar otra</Button></> : <><Button onClick={handleRetake}>Tomar otra</Button><Button type="primary" loading={confirming} onClick={() => void handleConfirm()}>Sí, usar esta foto</Button></>}</div>}
        </div>
      ) : <div className="relative aspect-video w-full">
        {loading && <div className="absolute inset-0 z-20 flex items-center justify-center"><Spin /></div>}
        {error && <Alert className="absolute inset-x-3 top-3 z-30" type="error" showIcon title={error} />}
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover [transform:rotateY(180deg)]" />
        <div className={`pointer-events-none absolute left-1/2 top-1/2 aspect-[3/4] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 ${accent} shadow-[0_0_0_9999px_rgba(2,6,23,0.48)] transition-colors`} />
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1 bg-slate-950/60 px-3 py-3 text-center text-sm text-white"><span>{mode === "enrollment" ? positionMessages[position] : instruction || "Mira hacia la cámara y sigue las indicaciones."}</span>{mode === "enrollment" && countdown !== null && <span className="text-xl font-bold text-emerald-300">{countdown}</span>}</div>
      </div>}
    </div>
  );
});

export default FaceCamera;
