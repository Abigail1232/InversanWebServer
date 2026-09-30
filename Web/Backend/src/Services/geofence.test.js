const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateDistanceMeters, validateLocation } = require("./geofence");

const branch = {
  lat: 15.500123,
  lng: -88.025321,
  attendance_radius_m: 75,
  max_gps_accuracy_m: 145,
  location_configured: true,
};

test("la misma coordenada tiene distancia practicamente cero", () => {
  assert.ok(calculateDistanceMeters(branch.lat, branch.lng, branch.lat, branch.lng) < 0.001);
});

test("permite accuracy 111 cuando el maximo configurado es 145 y esta dentro del radio", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 111 }, branch);
  assert.equal(result.allowed, true);
});

test("permite accuracy 145 cuando el maximo configurado es 145 y esta dentro del radio", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 145 }, branch);
  assert.equal(result.allowed, true);
});

test("rechaza una precision GPS superior a 145", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 146 }, branch);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "GPS_INACCURATE");
  assert.equal(result.accuracyMeters, 146);
  assert.equal(result.maxAccuracyMeters, 145);
});

test("mantiene el geofence: accuracy 111 permitido no habilita marcar fuera del radio", () => {
  const result = validateLocation({ latitude: branch.lat + 0.001, longitude: branch.lng, accuracy: 111 }, branch);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "OUTSIDE_GEOFENCE");
});

test("no considera configurada una sucursal con coordenadas de prueba", () => {
  const result = validateLocation({ latitude: branch.lat, longitude: branch.lng, accuracy: 9 }, { ...branch, location_configured: false });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "BRANCH_LOCATION_NOT_CONFIGURED");
});
