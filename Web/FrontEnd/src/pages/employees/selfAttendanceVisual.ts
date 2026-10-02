export const identityStatuses = [
  "CAMERA_WAITING",
  "PROCESSING",
  "LIVENESS_FAILED",
  "FACE_NOT_MATCHED",
  "FACE_QUALITY_INSUFFICIENT",
  "CHALLENGE_EXPIRED",
  "CHALLENGE_INVALID",
  "BIOMETRIC_RATE_LIMITED",
  "FACE_SERVICE_UNAVAILABLE",
  "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED",
  "BIOMETRIC_REENROLLMENT_REQUIRED",
  "BIOMETRIC_DISABLED",
  "BIOMETRIC_NOT_REGISTERED",
] as const;

export const confirmationStatuses = [
  "SUCCESS",
  "ATTENDANCE_ALREADY_REGISTERED",
  "ALREADY_MARKED",
] as const;

export const locationStatuses = [
  "GPS_WAITING",
  "GPS_INACCURATE",
  "OUTSIDE_GEOFENCE",
  "INVALID_LOCATION",
  "PERMISSION_DENIED",
  "POSITION_UNAVAILABLE",
  "TIMEOUT",
  "INACCURATE",
] as const;

const identityStatusSet = new Set<string>(identityStatuses);
const locationStatusSet = new Set<string>(locationStatuses);
const confirmationStatusSet = new Set<string>(confirmationStatuses);

export function isIdentityStatus(status: string): boolean {
  return identityStatusSet.has(status);
}

export function isLocationStatus(status: string): boolean {
  return locationStatusSet.has(status);
}

export function isConfirmationStatus(status: string): boolean {
  return confirmationStatusSet.has(status);
}

export function getAttendanceStep(status: string): number {
  if (isConfirmationStatus(status)) return 2;
  return isIdentityStatus(status) ? 1 : 0;
}

export function canShowLocationPanelForStatus(
  isEligible: boolean | undefined,
  hasBranch: boolean,
  status: string,
): boolean {
  return Boolean(isEligible && hasBranch && isLocationStatus(status));
}
