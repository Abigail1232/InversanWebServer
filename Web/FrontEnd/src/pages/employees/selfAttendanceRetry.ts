export const FACE_RETRY_LOCATION_MAX_AGE_MS = 30000;
export const MAX_AUTOMATIC_FACE_RETRIES = 2;
export const FACE_RETRY_DELAY_MS = 1000;

export const RETRYABLE_FACE_ERRORS = new Set([
  "FACE_NOT_MATCHED",
  "LIVENESS_FAILED",
  "FACE_QUALITY_INSUFFICIENT",
  "CHALLENGE_EXPIRED",
  "CHALLENGE_INVALID",
]);

export const LOCATION_RETRY_REQUIRED_ERRORS = new Set([
  "GPS_INACCURATE",
  "OUTSIDE_GEOFENCE",
  "INVALID_LOCATION",
]);

export function isFreshLocation(capturedAt: number | null, now = Date.now(), maxAgeMs = FACE_RETRY_LOCATION_MAX_AGE_MS): boolean {
  return capturedAt !== null && now - capturedAt <= maxAgeMs;
}

export function canRetryFaceError(code: string | undefined, retriesUsed: number): boolean {
  if (!code || code === "BIOMETRIC_RATE_LIMITED") return false;
  return RETRYABLE_FACE_ERRORS.has(code) && retriesUsed < MAX_AUTOMATIC_FACE_RETRIES;
}

export function isRetryableFaceError(code: string | undefined): boolean {
  return Boolean(code && RETRYABLE_FACE_ERRORS.has(code));
}

export function isFaceRetryExhausted(code: string | undefined, retriesUsed: number): boolean {
  return isRetryableFaceError(code) && retriesUsed >= MAX_AUTOMATIC_FACE_RETRIES;
}

export function shouldRefreshLocationForError(code: string | undefined, capturedAt: number | null, now = Date.now()): boolean {
  return !isFreshLocation(capturedAt, now) || LOCATION_RETRY_REQUIRED_ERRORS.has(code || "");
}

export type FaceRetryPlan =
  | { action: "none"; retriesUsed: number }
  | { action: "reuse" | "refresh"; retriesUsed: number };

// Refreshing the GPS must not reset retriesUsed: the limit applies per face session.
export function planFaceRetry(
  code: string | undefined,
  retriesUsed: number,
  hasLocation: boolean,
  capturedAt: number | null,
  now = Date.now(),
): FaceRetryPlan {
  if (!canRetryFaceError(code, retriesUsed)) return { action: "none", retriesUsed };
  const reuse = hasLocation && !shouldRefreshLocationForError(code, capturedAt, now);
  return { action: reuse ? "reuse" : "refresh", retriesUsed: retriesUsed + 1 };
}

// Releases the processing flag before the retry runs, so start() is not short-circuited by it.
export function finishFaceAttempt(processingRef: { current: boolean }, afterRelease?: () => void): void {
  processingRef.current = false;
  afterRelease?.();
}
