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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "self-attendance-retry-"));
  const tempFile = path.join(tempDir, `${path.basename(relativePath, ".ts")}.cjs`);
  fs.writeFileSync(tempFile, compiled);
  return require(tempFile);
}

const {
  MAX_AUTOMATIC_FACE_RETRIES,
  canRetryFaceError,
  finishFaceAttempt,
  isFaceRetryExhausted,
  planFaceRetry,
} = requireTsModule("src/pages/employees/selfAttendanceRetry.ts");

const NOW = 1_000_000;

test("location younger than 30s is reused", () => {
  const plan = planFaceRetry("FACE_NOT_MATCHED", 0, true, NOW - 29_000, NOW);
  assert.equal(plan.action, "reuse");
});

test("location older than 30s is refreshed", () => {
  const plan = planFaceRetry("FACE_NOT_MATCHED", 0, true, NOW - 31_000, NOW);
  assert.equal(plan.action, "refresh");
});

test("at most 2 automatic retries", () => {
  assert.equal(MAX_AUTOMATIC_FACE_RETRIES, 2);
  let used = 0;
  let performed = 0;
  for (let i = 0; i < 5; i += 1) {
    const plan = planFaceRetry("LIVENESS_FAILED", used, true, NOW, NOW);
    if (plan.action === "none") break;
    used = plan.retriesUsed;
    performed += 1;
  }
  assert.equal(performed, 2);
});

test("BIOMETRIC_RATE_LIMITED never retries", () => {
  assert.equal(canRetryFaceError("BIOMETRIC_RATE_LIMITED", 0), false);
  assert.equal(planFaceRetry("BIOMETRIC_RATE_LIMITED", 0, true, NOW, NOW).action, "none");
});

test("GPS refresh after a failure is not blocked by the processing flag", () => {
  const processingRef = { current: true };
  let processingWhenRetryRan = null;
  finishFaceAttempt(processingRef, () => {
    processingWhenRetryRan = processingRef.current;
  });
  assert.equal(processingWhenRetryRan, false);
  assert.equal(processingRef.current, false);
});

test("refreshing GPS does not reset the face retry counter", () => {
  const first = planFaceRetry("FACE_NOT_MATCHED", 0, true, NOW - 60_000, NOW);
  assert.equal(first.action, "refresh");
  assert.equal(first.retriesUsed, 1);
  const second = planFaceRetry("FACE_NOT_MATCHED", first.retriesUsed, true, NOW - 60_000, NOW);
  assert.equal(second.action, "refresh");
  assert.equal(second.retriesUsed, 2);
  assert.equal(planFaceRetry("FACE_NOT_MATCHED", second.retriesUsed, true, NOW - 60_000, NOW).action, "none");
});

test("initial attempt plus 2 automatic retries then stops", () => {
  assert.equal(planFaceRetry("FACE_NOT_MATCHED", 0, true, NOW, NOW).action, "reuse");
  assert.equal(planFaceRetry("FACE_NOT_MATCHED", 1, true, NOW, NOW).action, "reuse");
  assert.equal(planFaceRetry("FACE_NOT_MATCHED", 2, true, NOW, NOW).action, "none");
});

test("exhausted automatic face retries can be detected for manual retry UI", () => {
  assert.equal(isFaceRetryExhausted("FACE_NOT_MATCHED", 2), true);
  assert.equal(isFaceRetryExhausted("LIVENESS_FAILED", 2), true);
  assert.equal(isFaceRetryExhausted("BIOMETRIC_RATE_LIMITED", 2), false);
  assert.equal(isFaceRetryExhausted("ATTENDANCE_ALREADY_REGISTERED", 2), false);
});

test("terminal biometric and attendance states do not retry automatically", () => {
  assert.equal(canRetryFaceError("ATTENDANCE_ALREADY_REGISTERED", 0), false);
  assert.equal(canRetryFaceError("BIOMETRIC_DISABLED", 0), false);
  assert.equal(canRetryFaceError("BIOMETRIC_NOT_REGISTERED", 0), false);
  assert.equal(canRetryFaceError("BIOMETRIC_REENROLLMENT_REQUIRED", 0), false);
  assert.equal(canRetryFaceError("FACE_SERVICE_UNAVAILABLE", 0), false);
});
