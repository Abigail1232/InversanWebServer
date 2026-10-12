const EARTH_RADIUS_METERS = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(latitudeA, longitudeA, latitudeB, longitudeB) {
  const values = [latitudeA, longitudeA, latitudeB, longitudeB].map(Number);
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("Las coordenadas deben ser números válidos");
  }

  const [latA, lngA, latB, lngB] = values;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(latA))
      * Math.cos(toRadians(latB))
      * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validateLocation({ latitude, longitude, accuracy }, branch) {
  const values = [latitude, longitude, accuracy].map(Number);
  const [normalizedLatitude, normalizedLongitude, normalizedAccuracy] = values;

  if (
    values.some((value) => !Number.isFinite(value))
    || normalizedLatitude < -90
    || normalizedLatitude > 90
    || normalizedLongitude < -180
    || normalizedLongitude > 180
    || normalizedAccuracy < 0
  ) {
    return { allowed: false, reason: "INVALID_LOCATION" };
  }

  if (!branch.location_configured) {
    return {
      allowed: false,
      reason: "BRANCH_LOCATION_NOT_CONFIGURED",
      radiusMeters: Number(branch.attendance_radius_m),
      maxAccuracyMeters: Number(branch.max_gps_accuracy_m),
      accuracyMeters: normalizedAccuracy,
    };
  }

  const distanceMeters = calculateDistanceMeters(
    normalizedLatitude,
    normalizedLongitude,
    branch.lat,
    branch.lng,
  );
  const radiusMeters = Number(branch.attendance_radius_m);
  const maxAccuracyMeters = Number(branch.max_gps_accuracy_m);

  return {
    allowed: Number.isFinite(radiusMeters)
      && Number.isFinite(maxAccuracyMeters)
      && distanceMeters <= radiusMeters
      && normalizedAccuracy <= maxAccuracyMeters,
    reason: distanceMeters > radiusMeters ? "OUTSIDE_GEOFENCE" : normalizedAccuracy > maxAccuracyMeters ? "GPS_INACCURATE" : undefined,
    distanceMeters: Math.round(distanceMeters * 100) / 100,
    radiusMeters,
    maxAccuracyMeters,
    accuracyMeters: normalizedAccuracy,
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
  };
}

module.exports = { calculateDistanceMeters, validateLocation };