function calculateAttendancePenalty(horaEntrada) {
  if (typeof horaEntrada !== "string" || !/^\d{2}:\d{2}$/.test(horaEntrada)) {
    return { horas_faltadas: 0, categoria: "sin_registro" };
  }

  const [hour, minute] = horaEntrada.split(":").map(Number);
  if (hour > 23 || minute > 59) {
    return { horas_faltadas: 0, categoria: "sin_registro" };
  }

  const totalMinutes = hour * 60 + minute;

  if (totalMinutes <= 7 * 60 + 30) {
    return { horas_faltadas: 0, categoria: "puntual" };
  }

  if (totalMinutes <= 7 * 60 + 39) {
    return { horas_faltadas: 1, categoria: "penalizacion_1h" };
  }

  if (totalMinutes <= 7 * 60 + 49) {
    return { horas_faltadas: 2, categoria: "penalizacion_2h" };
  }

  return { horas_faltadas: 8, categoria: "falta_jornada" };
}

module.exports = { calculateAttendancePenalty };