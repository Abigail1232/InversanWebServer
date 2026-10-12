import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("src/pages/employees/SelfAttendance.tsx", "utf8");

function bodyBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${startMarker} exists`);
  assert.notEqual(end, -1, `${endMarker} exists`);
  return source.slice(start, end);
}

function bodyBetweenAfter(anchorMarker, startMarker, endMarker) {
  const anchor = source.indexOf(anchorMarker);
  assert.notEqual(anchor, -1, `${anchorMarker} exists`);
  const start = source.indexOf(startMarker, anchor);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${startMarker} exists after ${anchorMarker}`);
  assert.notEqual(end, -1, `${endMarker} exists after ${startMarker}`);
  return source.slice(start, end);
}

test("face check-in failure does not reset FaceCamera before the new challenge", () => {
  const catchBody = bodyBetweenAfter("const submit = useCallback", "} catch (error: unknown) {", "} finally {");
  assert.match(catchBody, /setChallenge\(null\)/);
  assert.doesNotMatch(catchBody, /setCameraResetToken/);
});

test("new challenge is the single automatic reset point", () => {
  const challengeBody = bodyBetween("const createChallengeForCurrentLocation = useCallback", "const requestChallengeForLocation");
  assert.match(challengeBody, /setChallenge\(next\)/);
  assert.match(challengeBody, /setCameraResetToken\(\(current\) => current \+ 1\)/);
});

test("retry challenge creation is handled by a safe wrapper", () => {
  const retryBody = bodyBetween("const scheduleNewFaceAttempt = useCallback", "const submit = useCallback");
  assert.match(retryBody, /requestChallengeForLocation\(reading\)/);
  assert.doesNotMatch(retryBody, /createChallengeForCurrentLocation\(reading\)/);
});

test("challenge creation failures are caught and do not create an automatic loop", () => {
  const safeBody = bodyBetween("const requestChallengeForLocation = useCallback", "const start = useCallback");
  assert.match(safeBody, /try \{/);
  assert.match(safeBody, /catch \(error: unknown\)/);
  assert.match(safeBody, /setStatus\(code\)/);
  assert.doesNotMatch(safeBody, /scheduleNewFaceAttempt/);
});

test("manual retry button appears only for exhausted non-rate-limited retries", () => {
  assert.match(source, /manualRetryAvailable && status !== "BIOMETRIC_RATE_LIMITED"/);
  assert.match(source, /restartFaceSession/);
});

test("manual retry starts a fresh face session without reloading the page", () => {
  const restartBody = bodyBetween("const restartFaceSession = useCallback", "const canUseAutomaticAttendance");
  assert.match(restartBody, /automaticFaceRetriesRef\.current = 0/);
  assert.match(restartBody, /isFreshLocation\(locationCapturedAtRef\.current\)/);
  assert.match(restartBody, /requestChallengeForLocation\(reading\)/);
  assert.match(restartBody, /start\(true, true\)/);
  assert.doesNotMatch(restartBody, /window\.location|location\.reload/);
});

test("branch change cancels a pending retry timer", () => {
  const branchChangeBody = bodyBetween("onChange={(value) => {", "setStatus(\"GPS_WAITING\")");
  assert.match(branchChangeBody, /window\.clearTimeout\(retryTimerRef\.current\)/);
  assert.match(branchChangeBody, /retryTimerRef\.current = null/);
});

test("retry facial keeps FaceCamera mounted and uses resetToken instead of a remount key", () => {
  assert.match(source, /resetToken=\{cameraResetToken\}/);
  assert.doesNotMatch(source, /key=\{.*cameraResetToken|key=\{.*attempt/i);
  assert.match(source, /canUseAutomaticAttendance && !isFinalStatus && !requestMode/);
});
