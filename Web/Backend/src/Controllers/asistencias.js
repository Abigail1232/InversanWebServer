const prisma = require("../config/database");

const PRIVILEGIOS_ASISTENCIA = {
  MARCAR: "ASI_MARCAR",
  ADMINISTRAR: "ASI_ADMINISTRAR",
  REPORTES: "ASI_REPORTES",
  ALL_ACCESS: "ALL_ACCESS",
};

function hasPrivilege(req, privilege) {
  const privilegios = req.userPrivileges || [];
  return privilegios.includes(PRIVILEGIOS_ASISTENCIA.ALL_ACCESS) || privilegios.includes(privilege);
}

function canAdminAttendance(req) {
  return hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.ADMINISTRAR);
}

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateOnly(value, fallback = todayDateString()) {
  const raw = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
  return new Date(`${raw}T00:00:00.000Z`);
}

function dateToString(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function isValidHour(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function calculatePenalty(horaEntrada) {
  if (!isValidHour(horaEntrada)) {
    return { horas_faltadas: 0, categoria: "sin_registro" };
  }

  const [hour, minute] = horaEntrada.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;

  const limit730 = 7 * 60 + 30;
  const limit740 = 7 * 60 + 40;
  const limit750 = 7 * 60 + 50;

  if (totalMinutes <= limit730) {
    return { horas_faltadas: 0, categoria: "puntual" };
  }

  if (totalMinutes <= limit740) {
    return { horas_faltadas: 1, categoria: "penalizacion_1h" };
  }

  if (totalMinutes <= limit750) {
    return { horas_faltadas: 2, categoria: "penalizacion_2h" };
  }

  return { horas_faltadas: 8, categoria: "falta_jornada" };
}

function fullName(usuario) {
  return [
    usuario.primer_nombre,
    usuario.segundo_nombre,
    usuario.primer_apellido,
    usuario.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function mapAttendance(row) {
  return {
    id_asistencia: row.id_asistencia,
    id_usuario: row.id_usuario,
    id_sucursal: row.id_sucursal,
    fecha: dateToString(row.fecha),
    hora_entrada: row.hora_entrada,
    horas_faltadas: row.horas_faltadas,
    categoria: row.categoria,
    observacion: row.observacion,
    usuario: row.usuario
      ? {
          id_usuario: row.usuario.id_usuario,
          nombre: fullName(row.usuario),
          usuario: row.usuario.usuario,
        }
      : undefined,
    sucursal: row.sucursal
      ? {
          id_sucursal: row.sucursal.id_sucursal,
          nombre: row.sucursal.nombre,
        }
      : undefined,
  };
}

async function getUserBranchIds(idUsuario) {
  const asignaciones = await prisma.empleado_Sucursal.findMany({
    where: { id_usuario: idUsuario },
    select: { id_sucursal: true },
  });

  const sucursalesGerente = await prisma.sucursal.findMany({
    where: { id_usuario: idUsuario, activo: true },
    select: { id_sucursal: true },
  });

  return Array.from(
    new Set([
      ...asignaciones.map((a) => a.id_sucursal),
      ...sucursalesGerente.map((s) => s.id_sucursal),
    ]),
  );
}

async function getAllowedBranches(req) {
  if (canAdminAttendance(req)) {
    return prisma.sucursal.findMany({
      where: { activo: true },
      select: { id_sucursal: true, nombre: true, activo: true },
      orderBy: { nombre: "asc" },
    });
  }

  const branchIds = await getUserBranchIds(req.user.id_usuario);
  if (branchIds.length === 0) return [];

  return prisma.sucursal.findMany({
    where: { id_sucursal: { in: branchIds }, activo: true },
    select: { id_sucursal: true, nombre: true, activo: true },
    orderBy: { nombre: "asc" },
  });
}

async function canAccessBranch(req, idSucursal) {
  if (canAdminAttendance(req)) return true;
  const branchIds = await getUserBranchIds(req.user.id_usuario);
  return branchIds.includes(idSucursal);
}

async function getAttendanceContext(req, res) {
  try {
    const sucursales = await getAllowedBranches(req);

    return res.json({
      canAdministrarAsistencia: canAdminAttendance(req),
      canReportesAsistencia: hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.REPORTES),
      defaultBranchId: sucursales[0]?.id_sucursal || null,
      sucursales,
    });
  } catch (error) {
    console.error("Error obteniendo contexto de asistencia:", error);
    return res.status(500).json({ error: "Error obteniendo contexto de asistencia" });
  }
}

async function getEmployeesForAttendance(req, res) {
  try {
    const idSucursal = parseId(req.query.id_sucursal);

    if (!idSucursal) {
      return res.status(400).json({ error: "Debe enviar una sucursal válida" });
    }

    if (!(await canAccessBranch(req, idSucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    const empleados = await prisma.empleado_Sucursal.findMany({
      where: {
        id_sucursal: idSucursal,
        usuario: { activo: true },
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            usuario: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
            activo: true,
          },
        },
      },
      orderBy: { usuario: { primer_nombre: "asc" } },
    });

    return res.json(
      empleados.map((e) => ({
        id_usuario: e.usuario.id_usuario,
        usuario: e.usuario.usuario,
        nombre: fullName(e.usuario),
        activo: e.usuario.activo,
      })),
    );
  } catch (error) {
    console.error("Error obteniendo empleados para asistencia:", error);
    return res.status(500).json({ error: "Error obteniendo empleados para asistencia" });
  }
}

async function getAttendanceDay(req, res) {
  try {
    const idSucursal = parseId(req.query.id_sucursal);
    const fechaText = typeof req.query.fecha === "string" ? req.query.fecha : todayDateString();
    const fecha = parseDateOnly(fechaText);

    if (!idSucursal) {
      return res.status(400).json({ error: "Debe enviar una sucursal válida" });
    }

    if (!(await canAccessBranch(req, idSucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    const empleados = await prisma.empleado_Sucursal.findMany({
      where: {
        id_sucursal: idSucursal,
        usuario: { activo: true },
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            usuario: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
            activo: true,
          },
        },
      },
      orderBy: { usuario: { primer_nombre: "asc" } },
    });

    const asistencias = await prisma.asistencia.findMany({
      where: { id_sucursal: idSucursal, fecha },
    });
    const byUser = new Map(asistencias.map((a) => [a.id_usuario, a]));

    return res.json({
      fecha: dateToString(fecha),
      id_sucursal: idSucursal,
      empleados: empleados.map((e) => {
        const asistencia = byUser.get(e.usuario.id_usuario);
        return {
          id_usuario: e.usuario.id_usuario,
          usuario: e.usuario.usuario,
          nombre: fullName(e.usuario),
          activo: e.usuario.activo,
          id_asistencia: asistencia?.id_asistencia || null,
          hora_entrada: asistencia?.hora_entrada || "",
          horas_faltadas: asistencia?.horas_faltadas || 0,
          categoria: asistencia?.categoria || "sin_registro",
          observacion: asistencia?.observacion || "",
        };
      }),
    });
  } catch (error) {
    console.error("Error obteniendo día de asistencia:", error);
    return res.status(500).json({ error: "Error obteniendo asistencia del día" });
  }
}

async function markAttendance(req, res) {
  try {
    const idSucursal = parseId(req.body.id_sucursal);
    const fechaText = typeof req.body.fecha === "string" ? req.body.fecha : todayDateString();
    const fecha = parseDateOnly(fechaText);
    const asistencias = Array.isArray(req.body.asistencias) ? req.body.asistencias : [];

    if (!idSucursal) {
      return res.status(400).json({ error: "Debe enviar una sucursal válida" });
    }

    if (!(await canAccessBranch(req, idSucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    if (asistencias.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos un registro de asistencia" });
    }

    const userIds = asistencias.map((item) => parseId(item.id_usuario)).filter(Boolean);
    if (userIds.length !== asistencias.length) {
      return res.status(400).json({ error: "Hay usuarios inválidos en la asistencia" });
    }

    const empleadosValidos = await prisma.empleado_Sucursal.findMany({
      where: {
        id_sucursal: idSucursal,
        id_usuario: { in: userIds },
        usuario: { activo: true },
      },
      select: { id_usuario: true },
    });
    const validUserIds = new Set(empleadosValidos.map((e) => e.id_usuario));

    if (userIds.some((id) => !validUserIds.has(id))) {
      return res.status(400).json({
        error: "Solo puede marcar asistencia de empleados activos asignados a la sucursal seleccionada",
      });
    }

    const createdOrUpdated = [];

    for (const item of asistencias) {
      const idUsuario = parseId(item.id_usuario);
      const horaEntrada = String(item.hora_entrada || "").trim();
      const observacion = typeof item.observacion === "string" && item.observacion.trim()
        ? item.observacion.trim()
        : null;

      if (!isValidHour(horaEntrada)) {
        return res.status(400).json({ error: `Hora inválida para usuario ${idUsuario}. Use formato HH:mm` });
      }

      const penalty = calculatePenalty(horaEntrada);

      const row = await prisma.asistencia.upsert({
        where: {
          id_usuario_id_sucursal_fecha: {
            id_usuario: idUsuario,
            id_sucursal: idSucursal,
            fecha,
          },
        },
        create: {
          id_usuario: idUsuario,
          id_sucursal: idSucursal,
          fecha,
          hora_entrada: horaEntrada,
          horas_faltadas: penalty.horas_faltadas,
          categoria: penalty.categoria,
          observacion,
          registrado_por: req.user.id_usuario,
          actualizado_por: req.user.id_usuario,
        },
        update: {
          hora_entrada: horaEntrada,
          horas_faltadas: penalty.horas_faltadas,
          categoria: penalty.categoria,
          observacion,
          actualizado_por: req.user.id_usuario,
        },
        include: {
          usuario: true,
          sucursal: true,
        },
      });

      createdOrUpdated.push(mapAttendance(row));
    }

    return res.json({
      mensaje: "Asistencia guardada correctamente",
      data: createdOrUpdated,
    });
  } catch (error) {
    console.error("Error guardando asistencia:", error);
    return res.status(500).json({ error: "Error guardando asistencia" });
  }
}

async function getAttendanceReports(req, res) {
  try {
    const idSucursal = parseId(req.query.id_sucursal);
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : todayDateString().slice(0, 8) + "01",
    );
    const fechaFin = parseDateOnly(typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : todayDateString());

    if (!idSucursal) {
      return res.status(400).json({ error: "Debe enviar una sucursal válida" });
    }

    if (!(await canAccessBranch(req, idSucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    const empleados = await prisma.empleado_Sucursal.findMany({
      where: {
        id_sucursal: idSucursal,
        usuario: { activo: true },
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            usuario: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
          },
        },
        sucursal: { select: { id_sucursal: true, nombre: true } },
      },
      orderBy: { usuario: { primer_nombre: "asc" } },
    });

    const asistencias = await prisma.asistencia.findMany({
      where: {
        id_sucursal: idSucursal,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      include: {
        usuario: true,
        sucursal: true,
      },
    });

    const grouped = new Map();

    for (const empleado of empleados) {
      grouped.set(empleado.usuario.id_usuario, {
        id_usuario: empleado.usuario.id_usuario,
        usuario: empleado.usuario.usuario,
        nombre: fullName(empleado.usuario),
        sucursal: empleado.sucursal.nombre,
        rango_7_31_7_40: 0,
        rango_7_41_7_50: 0,
        despues_7_50: 0,
        horas_faltadas: 0,
        registros: 0,
      });
    }

    for (const row of asistencias) {
      if (!grouped.has(row.id_usuario)) {
        grouped.set(row.id_usuario, {
          id_usuario: row.id_usuario,
          usuario: row.usuario.usuario,
          nombre: fullName(row.usuario),
          sucursal: row.sucursal.nombre,
          rango_7_31_7_40: 0,
          rango_7_41_7_50: 0,
          despues_7_50: 0,
          horas_faltadas: 0,
          registros: 0,
        });
      }

      const item = grouped.get(row.id_usuario);
      if (row.categoria === "penalizacion_1h") item.rango_7_31_7_40 += 1;
      if (row.categoria === "penalizacion_2h") item.rango_7_41_7_50 += 1;
      if (row.categoria === "falta_jornada") item.despues_7_50 += 1;
      item.horas_faltadas += row.horas_faltadas || 0;
      item.registros += 1;
    }

    return res.json(Array.from(grouped.values()));
  } catch (error) {
    console.error("Error generando reportes de asistencia:", error);
    return res.status(500).json({ error: "Error generando reportes de asistencia" });
  }
}

async function getUserAttendanceRecords(req, res) {
  try {
    const idUsuario = parseId(req.params.idUsuario);
    const idSucursal = parseId(req.query.id_sucursal);
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : todayDateString().slice(0, 8) + "01",
    );
    const fechaFin = parseDateOnly(typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : todayDateString());

    if (!idUsuario || !idSucursal) {
      return res.status(400).json({ error: "Debe enviar usuario y sucursal válidos" });
    }

    if (!(await canAccessBranch(req, idSucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    const registros = await prisma.asistencia.findMany({
      where: {
        id_usuario: idUsuario,
        id_sucursal: idSucursal,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      include: {
        usuario: true,
        sucursal: true,
      },
      orderBy: { fecha: "asc" },
    });

    return res.json(registros.map(mapAttendance));
  } catch (error) {
    console.error("Error obteniendo registros de asistencia:", error);
    return res.status(500).json({ error: "Error obteniendo registros de asistencia" });
  }
}

async function updateAttendance(req, res) {
  try {
    const idAsistencia = parseId(req.params.idAsistencia);
    const horaEntrada = String(req.body.hora_entrada || "").trim();
    const observacion = typeof req.body.observacion === "string" && req.body.observacion.trim()
      ? req.body.observacion.trim()
      : null;

    if (!idAsistencia) {
      return res.status(400).json({ error: "Asistencia inválida" });
    }

    if (!isValidHour(horaEntrada)) {
      return res.status(400).json({ error: "Hora inválida. Use formato HH:mm" });
    }

    const actual = await prisma.asistencia.findUnique({
      where: { id_asistencia: idAsistencia },
    });

    if (!actual) {
      return res.status(404).json({ error: "Registro de asistencia no encontrado" });
    }

    if (!(await canAccessBranch(req, actual.id_sucursal))) {
      return res.status(403).json({ error: "No tiene acceso a esta sucursal" });
    }

    const penalty = calculatePenalty(horaEntrada);
    const updated = await prisma.asistencia.update({
      where: { id_asistencia: idAsistencia },
      data: {
        hora_entrada: horaEntrada,
        horas_faltadas: penalty.horas_faltadas,
        categoria: penalty.categoria,
        observacion,
        actualizado_por: req.user.id_usuario,
      },
      include: {
        usuario: true,
        sucursal: true,
      },
    });

    return res.json({
      mensaje: "Registro actualizado correctamente",
      data: mapAttendance(updated),
    });
  } catch (error) {
    console.error("Error actualizando asistencia:", error);
    return res.status(500).json({ error: "Error actualizando asistencia" });
  }
}

module.exports = {
  getAttendanceContext,
  getEmployeesForAttendance,
  getAttendanceDay,
  markAttendance,
  getAttendanceReports,
  getUserAttendanceRecords,
  updateAttendance,
};
