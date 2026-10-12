export type GeolocationReading = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export class GeolocationError extends Error {
  constructor(public readonly code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED" | "INACCURATE") {
    super(code);
  }
}

export function getCurrentLocation(): Promise<GeolocationReading> {
  if (!navigator.geolocation) {
    return Promise.reject(new GeolocationError("UNSUPPORTED"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const reading = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        };
        if (!Number.isFinite(reading.accuracy)) {
          reject(new GeolocationError("POSITION_UNAVAILABLE"));
          return;
        }
        resolve(reading);
      },
      (error) => {
        const code = error.code === 1
          ? "PERMISSION_DENIED"
          : error.code === 2
            ? "POSITION_UNAVAILABLE"
            : "TIMEOUT";
        reject(new GeolocationError(code));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  });
}

export function getBestCurrentLocation(options: {
  targetAccuracyMeters?: number;
  durationMs?: number;
  onReading?: (reading: GeolocationReading) => void;
} = {}): Promise<GeolocationReading> {
  if (!navigator.geolocation) return Promise.reject(new GeolocationError("UNSUPPORTED"));

  const durationMs = options.durationMs ?? 30000;
  const targetAccuracyMeters = options.targetAccuracyMeters;

  return new Promise((resolve, reject) => {
    let best: GeolocationReading | null = null;
    let settled = false;
    let watchId: number | null = null;
    let timeoutId: number | null = null;

    const finish = (error?: GeolocationError, forceReject = false) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (best && !forceReject) resolve(best);
      else reject(error || new GeolocationError("TIMEOUT"));
    };

    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const reading = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
        if (!Number.isFinite(reading.accuracy)) return;
        if (!best || reading.accuracy < best.accuracy) {
          best = reading;
          options.onReading?.(best);
        }
        if (targetAccuracyMeters !== undefined && best.accuracy <= targetAccuracyMeters) finish();
      },
      (error) => {
        const code = error.code === 1 ? "PERMISSION_DENIED" : error.code === 2 ? "POSITION_UNAVAILABLE" : "TIMEOUT";
        if (code === "PERMISSION_DENIED" || !best) finish(new GeolocationError(code), true);
      },
      { enableHighAccuracy: true, timeout: durationMs, maximumAge: 0 },
    );
    timeoutId = window.setTimeout(() => finish(), durationMs);
  });
}
