const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateAttendancePenalty } = require("./attendancePenalty");

const cases = [
  ["07:29", "puntual", 0],
  ["07:30", "puntual", 0],
  ["07:31", "penalizacion_1h", 1],
  ["07:39", "penalizacion_1h", 1],
  ["07:40", "penalizacion_2h", 2],
  ["07:49", "penalizacion_2h", 2],
  ["07:50", "falta_jornada", 8],
  ["08:00", "falta_jornada", 8],
];

for (const [hora, categoria, horas_faltadas] of cases) {
  test(`${hora} calcula ${categoria} (${horas_faltadas} horas)`, () => {
    assert.deepEqual(calculateAttendancePenalty(hora), { categoria, horas_faltadas });
  });
}

test("una hora inválida no genera penalización", () => {
  assert.deepEqual(calculateAttendancePenalty("07:60"), {
    horas_faltadas: 0,
    categoria: "sin_registro",
  });
});