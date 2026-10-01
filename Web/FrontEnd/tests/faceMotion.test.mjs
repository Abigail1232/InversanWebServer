import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function requireTsModule(relativePath) {
  const absolutePath = path.resolve(relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "face-motion-"));
  const tempFile = path.join(tempDir, `${path.basename(relativePath, ".ts")}.cjs`);
  fs.writeFileSync(tempFile, compiled);
  return require(tempFile);
}

const {
  buildPassiveLivenessFrames,
  getNormalizedFaceMotion,
  hasPassiveFaceMotion,
  shouldAutoCapturePassiveMotion,
} = requireTsModule("src/components/faceMotion.ts");

function facePoints(transform = (point) => point) {
  const points = Array.from({ length: 478 }, (_, index) => {
    const ring = index % 32;
    const row = Math.floor(index / 32);
    return { x: 0.2 + ring * 0.012, y: 0.25 + row * 0.009 };
  });
  points[1] = { x: 0.5, y: 0.48 };
  points[33] = { x: 0.38, y: 0.42 };
  points[61] = { x: 0.43, y: 0.58 };
  points[133] = { x: 0.46, y: 0.42 };
  points[152] = { x: 0.5, y: 0.72 };
  points[199] = { x: 0.5, y: 0.61 };
  points[263] = { x: 0.62, y: 0.42 };
  points[291] = { x: 0.57, y: 0.58 };
  points[362] = { x: 0.54, y: 0.42 };
  points[454] = { x: 0.7, y: 0.5 };
  return points.map(transform);
}

test("static face does not trigger passive liveness", () => {
  const face = facePoints();
  assert.equal(hasPassiveFaceMotion([{ at: 0, points: face }, { at: 300, points: face }]), false);
});

test("rigid landmark translation is ignored", () => {
  const base = facePoints();
  const translated = facePoints((point) => ({ x: point.x + 0.02, y: point.y + 0.015 }));
  assert.ok(getNormalizedFaceMotion(translated, base) < 1e-12);
  assert.equal(hasPassiveFaceMotion([{ at: 0, points: base }, { at: 300, points: translated }]), false);
});

test("uniform landmark scaling is effectively ignored", () => {
  const base = facePoints();
  const scaled = facePoints((point) => ({ x: 0.5 + (point.x - 0.5) * 1.08, y: 0.5 + (point.y - 0.5) * 1.08 }));
  assert.ok(getNormalizedFaceMotion(scaled, base) < 1e-12);
  assert.equal(hasPassiveFaceMotion([{ at: 0, points: base }, { at: 300, points: scaled }]), false);
});

test("small real face geometry change triggers passive liveness", () => {
  const base = facePoints();
  const moved = facePoints((point, index) => {
    if ([1, 61, 133, 199, 291].includes(index)) return { x: point.x + 0.018, y: point.y - 0.004 };
    if ([33, 152, 263, 362, 454].includes(index)) return { x: point.x - 0.006, y: point.y + 0.008 };
    return point;
  });
  assert.equal(hasPassiveFaceMotion([{ at: 0, points: base }, { at: 300, points: moved }]), true);
});

test("passive capture sends baseline, motion and final frames in order", () => {
  assert.deepEqual(buildPassiveLivenessFrames("baseline", "motion", "final"), ["baseline", "motion", "final"]);
  assert.deepEqual(buildPassiveLivenessFrames("baseline", null, "final"), []);
});

test("30 valid callbacks still allow only one auto-capture trigger", () => {
  const base = facePoints();
  const moved = facePoints((point, index) => [1, 61, 133, 199, 291, 362].includes(index) ? { x: point.x + 0.02, y: point.y } : point);
  const samples = [{ at: 0, points: base }, { at: 300, points: moved }];
  let captureTriggered = false;
  let triggers = 0;
  for (let index = 0; index < 30; index += 1) {
    const shouldCapture = shouldAutoCapturePassiveMotion({
      samples,
      elapsedMs: 300 + index,
      autoCaptureEnabled: true,
      captureTriggered,
      captureInProgress: false,
    });
    if (shouldCapture) {
      triggers += 1;
      captureTriggered = true;
    }
  }
  assert.equal(triggers, 1);
});

test("SelfAttendance does not remount FaceCamera when GPS challenge becomes ready", () => {
  const source = fs.readFileSync("src/pages/employees/SelfAttendance.tsx", "utf8");
  const startBody = source.slice(source.indexOf("const start = useCallback"), source.indexOf("const scheduleNewAttempt"));
  assert.match(startBody, /setChallenge\(next\)/);
  assert.doesNotMatch(startBody, /setAttemptKey/);
  assert.match(source, /setAttemptKey\(\(current\) => current \+ 1\);/);
});

test("retryable face failures keep generating a new attempt path", () => {
  const source = fs.readFileSync("src/pages/employees/SelfAttendance.tsx", "utf8");
  assert.match(source, /FACE_NOT_MATCHED/);
  assert.match(source, /LIVENESS_FAILED/);
  assert.match(source, /CHALLENGE_EXPIRED/);
  assert.match(source, /CHALLENGE_INVALID/);
  assert.match(source, /scheduleNewAttempt\(\)/);
});
