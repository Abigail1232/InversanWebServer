const assert = require("node:assert/strict");
const { test } = require("node:test");
const { BUSINESS_TIME_ZONE, getCurrentBusinessDate } = require("./businessDate");

test("business date uses America/Tegucigalpa around UTC midnight", () => {
  assert.equal(BUSINESS_TIME_ZONE, "America/Tegucigalpa");

  const beforeHondurasMidnight = getCurrentBusinessDate(new Date("2026-09-26T05:59:00.000Z"));
  const afterHondurasMidnight = getCurrentBusinessDate(new Date("2026-09-26T06:00:00.000Z"));

  assert.equal(beforeHondurasMidnight.toISOString(), "2026-09-25T00:00:00.000Z");
  assert.equal(afterHondurasMidnight.toISOString(), "2026-09-26T00:00:00.000Z");
});