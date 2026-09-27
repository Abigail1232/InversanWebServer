const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateDistanceMeters, validateLocation } = require("./geofence");

const branch = {
  lat: 15.500123,
  lng: -88.025321,
  attendance_radius_m: 75,
  max_gps_accuracy_m: 50,
  location_configured: true,
};

test("la misma coordenada tiene distancia prácticamente cero", () => {
  assert.ok(calculateDistanceMeters(branch.lat, branch.lng, branch.lat, branch.lng) < 0.001);
});

test("permite una ubicación dentro del radio y con precisión válida", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 9 }, branch);
  assert.equal(result.allowed, true);
});

test("rechaza una ubicación fuera del radio", () => {
  const result = validateLocation({ latitude: branch.lat + 0.001, longitude: branch.lng, accuracy: 9 }, branch);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "OUTSIDE_GEOFENCE");
});

test("rechaza una precisión GPS superior a la configuración", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 51 }, branch);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "GPS_INACCURATE");
  assert.equal(result.accuracyMeters, 51);
  assert.equal(result.maxAccuracyMeters, 50);
});

test("no considera configurada una sucursal con coordenadas de prueba", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 9 }, { ...branch, location_configured: false });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "BRANCH_LOCATION_NOT_CONFIGURED");
});