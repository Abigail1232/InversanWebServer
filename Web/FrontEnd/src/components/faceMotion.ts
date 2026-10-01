export const PASSIVE_LIVENESS_WINDOW_MS = 700;
export const MIN_FACE_MOTION = 0.012;
export const MAX_FACE_MOTION = 0.12;
export const AUTO_CAPTURE_STABILITY_MS = 220;
export const AUTO_CAPTURE_FRAME_COUNT = 3;
export const AUTO_CAPTURE_FRAME_INTERVAL_MS = 120;

const MOTION_LANDMARK_INDICES = [1, 33, 61, 133, 152, 199, 263, 291, 362, 454];

export type FaceLandmarkPoint = { x: number; y: number; z?: number };
export type LandmarkSample = { at: number; points: Array<{ x: number; y: number }> };

export function normalizeFaceLandmarks(points: FaceLandmarkPoint[]): Array<{ x: number; y: number }> {
  if (!points.length) return [];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY);
  if (scale <= 0) return [];
  return points.map((point) => ({
    x: (point.x - centerX) / scale,
    y: (point.y - centerY) / scale,
  }));
}

export function getNormalizedFaceMotion(current: FaceLandmarkPoint[], previous: FaceLandmarkPoint[]): number {
  if (!current.length || current.length !== previous.length) return 0;
  const normalizedCurrent = normalizeFaceLandmarks(current);
  const normalizedPrevious = normalizeFaceLandmarks(previous);
  if (!normalizedCurrent.length || normalizedCurrent.length !== normalizedPrevious.length) return 0;

  let total = 0;
  let used = 0;
  for (const index of MOTION_LANDMARK_INDICES) {
    const a = normalizedCurrent[index];
    const b = normalizedPrevious[index];
    if (!a || !b) continue;
    total += Math.hypot(a.x - b.x, a.y - b.y);
    used += 1;
  }
  return used ? total / used : 0;
}

export function hasPassiveFaceMotion(samples: LandmarkSample[]): boolean {
  if (samples.length < 2) return false;
  const latest = samples[samples.length - 1];
  return samples.slice(0, -1).some((sample) => {
    const age = latest.at - sample.at;
    if (age < 0 || age > PASSIVE_LIVENESS_WINDOW_MS) return false;
    const motion = getNormalizedFaceMotion(latest.points, sample.points);
    return motion >= MIN_FACE_MOTION && motion <= MAX_FACE_MOTION;
  });
}

export function shouldAutoCapturePassiveMotion(params: {
  samples: LandmarkSample[];
  elapsedMs: number;
  autoCaptureEnabled: boolean;
  captureTriggered: boolean;
  captureInProgress: boolean;
}): boolean {
  return (
    params.autoCaptureEnabled
    && params.elapsedMs >= AUTO_CAPTURE_STABILITY_MS
    && !params.captureTriggered
    && !params.captureInProgress
    && hasPassiveFaceMotion(params.samples)
  );
}

export function buildPassiveLivenessFrames(baselineFrame: string | null, motionFrame: string | null, finalFrame: string | null): string[] {
  if (!baselineFrame || !motionFrame || !finalFrame) return [];
  return [baselineFrame, motionFrame, finalFrame];
}
