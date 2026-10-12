import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function requireTsModule(relativePath) {
  const source = fs.readFileSync(path.resolve(relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "self-attendance-visual-"));
  const tempFile = path.join(tempDir, `${path.basename(relativePath, ".ts")}.cjs`);
  fs.writeFileSync(tempFile, compiled);
  return require(tempFile);
}

const {
  canShowLocationPanelForStatus,
  getAttendanceStep,
  isConfirmationStatus,
} = requireTsModule("src/pages/employees/selfAttendanceVisual.ts");

const identityStatuses = [
  "CAMERA_WAITING",
  "FACE_NOT_MATCHED",
  "LIVENESS_FAILED",
  "FACE_QUALITY_INSUFFICIENT",
  "CHALLENGE_EXPIRED",
  "CHALLENGE_INVALID",
  "BIOMETRIC_RATE_LIMITED",
];

for (const status of identityStatuses) {
  test(`${status} keeps the identity step active`, () => {
    assert.equal(getAttendanceStep(status), 1);
  });
}

test("GPS_INACCURATE keeps the location step active", () => {
  assert.equal(getAttendanceStep("GPS_INACCURATE"), 0);
});

test("OUTSIDE_GEOFENCE keeps the location step active", () => {
  assert.equal(getAttendanceStep("OUTSIDE_GEOFENCE"), 0);
});

test("SUCCESS shows the confirmation step", () => {
  assert.equal(getAttendanceStep("SUCCESS"), 2);
});

test("ATTENDANCE_ALREADY_REGISTERED shows the confirmation step", () => {
  assert.equal(getAttendanceStep("ATTENDANCE_ALREADY_REGISTERED"), 2);
  assert.equal(isConfirmationStatus("ATTENDANCE_ALREADY_REGISTERED"), true);
});

test("challenge null plus FACE_NOT_MATCHED does not show the location panel", () => {
  const challenge = null;
  assert.equal(challenge, null);
  assert.equal(canShowLocationPanelForStatus(true, true, "FACE_NOT_MATCHED"), false);
});

test("challenge null plus LIVENESS_FAILED does not show the location panel", () => {
  const challenge = null;
  assert.equal(challenge, null);
  assert.equal(canShowLocationPanelForStatus(true, true, "LIVENESS_FAILED"), false);
});

test("GPS_WAITING shows the location panel", () => {
  assert.equal(canShowLocationPanelForStatus(true, true, "GPS_WAITING"), true);
});
