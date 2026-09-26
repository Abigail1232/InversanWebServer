const prisma = require("../config/database");
const { calculateAttendancePenalty } = require("../Services/attendancePenalty");
const { getCurrentBusinessDate } = require("../Services/businessDate");

const PRIVILEGIOS_ASISTENCIA = {
  MARCAR: "ASI_MARCAR",
  ADMINISTRAR: "ASI_ADMINISTRAR",
  REPORTES: "ASI_REPORTES",
  EDITAR: "ASI_EDITAR",
  ALL_ACCESS: "ALL_ACCESS",
};

function hasPrivilege(req, privilege) {
  const privilegios = req.userPrivileges || [];
  return privilegios.includes(PRIVILEGIOS_ASISTENCIA.ALL_ACCESS) || privilegios.includes(privilege);
}

function canSelectAnyBranch(req) {
  return hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.ALL_ACCESS);
}

function canEditAttendance(req) {
  return hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.EDITAR);
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

async function getEmployeeBranchIds(idUsuario) {
  const assignments = await prisma.empleado_Sucursal.findMany({
    where: { id_usuario: idUsuario },
    select: { id_sucursal: true },
  });

  return Array.from(new Set(assignments.map((assignment) => assignment.id_sucursal)));
}

async function getAllowedBranches(req) {
  if (canSelectAnyBranch(req)) {
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
  if (canSelectAnyBranch(req)) return true;
  const branchIds = await getUserBranchIds(req.user.id_usuario);
  return branchIds.includes(idSucursal);
}

async function getAttendanceContext(req, res) {
  try {
    const sucursales = await getAllowedBranches(req);

    return res.json({
      canAdministrarAsistencia: canSelectAnyBranch(req),
      canReportesAsistencia:
        hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.REPORTES) ||
        hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.MARCAR) ||
        hasPrivilege(req, PRIVILEGIOS_ASISTENCIA.ADMINISTRAR),
      canEditarAsistencia: canEditAttendance(req),
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
    const fecha = getCurrentBusinessDate();

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
    const fecha = getCurrentBusinessDate();
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

    const normalizedItems = [];
    const submittedUserIds = new Set();

    for (const item of asistencias) {
      const idUsuario = parseId(item.id_usuario);
      const horaEntrada = String(item.hora_entrada || "").trim();
      const observacion = typeof item.observacion === "string" && item.observacion.trim()
        ? item.observacion.trim()
        : null;

      if (!isValidHour(horaEntrada)) {
        return res.status(400).json({ error: `Hora inválida para usuario ${idUsuario}. Use formato HH:mm` });
      }

      if (submittedUserIds.has(idUsuario)) {
        return res.status(400).json({ error: "No puede enviar más de un registro por empleado" });
      }

      submittedUserIds.add(idUsuario);
      normalizedItems.push({ idUsuario, horaEntrada, observacion });
    }

    const transactionResult = await prisma.$transaction(async (transaction) => {
      const existingRecords = await transaction.asistencia.findMany({
        where: {
          id_sucursal: idSucursal,
          fecha,
          id_usuario: { in: userIds },
        },
        include: { usuario: true, sucursal: true },
      });
      const existingByUser = new Map(existingRecords.map((record) => [record.id_usuario, record]));

      if (!canEditAttendance(req)) {
        const changedRecord = normalizedItems.find((item) => {
          const existing = existingByUser.get(item.idUsuario);
          return existing && (
            existing.hora_entrada !== item.horaEntrada ||
            (existing.observacion || null) !== item.observacion
          );
        });

        if (changedRecord) return { forbidden: true };
      }

      const savedRecords = [];

      for (const item of normalizedItems) {
        const existing = existingByUser.get(item.idUsuario);
        if (existing && !canEditAttendance(req)) {
          savedRecords.push(existing);
          continue;
        }

        const penalty = calculateAttendancePenalty(item.horaEntrada);
        const data = {
          hora_entrada: item.horaEntrada,
          horas_faltadas: penalty.horas_faltadas,
          categoria: penalty.categoria,
          observacion: item.observacion,
        };

        const row = existing
          ? await transaction.asistencia.update({
              where: { id_asistencia: existing.id_asistencia },
              data: { ...data, actualizado_por: req.user.id_usuario },
              include: { usuario: true, sucursal: true },
            })
          : await transaction.asistencia.create({
              data: {
                ...data,
                id_usuario: item.idUsuario,
                id_sucursal: idSucursal,
                fecha,
                registrado_por: req.user.id_usuario,
                actualizado_por: req.user.id_usuario,
              },
              include: { usuario: true, sucursal: true },
            });

        savedRecords.push(row);
      }

      return { savedRecords };
    });

    if (transactionResult.forbidden) {
      return res.status(403).json({ error: "No tiene privilegio para modificar asistencias existentes" });
    }

    return res.json({
      success: true,
      mensaje: "Asistencia guardada correctamente",
      fecha: dateToString(fecha),
      data: transactionResult.savedRecords.map(mapAttendance),
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

    const employeeIds = empleados.map((empleado) => empleado.id_usuario);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        id_sucursal: idSucursal,
        id_usuario: { in: employeeIds },
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
        rango_7_31_7_39: 0,
        rango_7_40_7_49: 0,
        desde_7_50: 0,
        horas_faltadas: 0,
        registros: 0,
      });
    }

    for (const row of asistencias) {
      const item = grouped.get(row.id_usuario);
      if (row.categoria === "penalizacion_1h") item.rango_7_31_7_39 += 1;
      if (row.categoria === "penalizacion_2h") item.rango_7_40_7_49 += 1;
      if (row.categoria === "falta_jornada") item.desde_7_50 += 1;
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

    const assignment = await prisma.empleado_Sucursal.findUnique({
      where: {
        id_usuario_id_sucursal: {
          id_usuario: idUsuario,
          id_sucursal: idSucursal,
        },
      },
      select: { id_usuario: true },
    });

    if (!assignment) {
      return res.status(403).json({ error: "El empleado no pertenece a esta sucursal" });
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
    if (!canEditAttendance(req)) {
      return res.status(403).json({ error: "No tiene privilegio para editar asistencia" });
    }

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

    const penalty = calculateAttendancePenalty(horaEntrada);
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

function getMonthRange(query) {
  const current = new Date();
  const month = query.mes === undefined ? current.getUTCMonth() + 1 : Number(query.mes);
  const year = query.anio === undefined ? current.getUTCFullYear() : Number(query.anio);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970 || year > 9999) {
    return null;
  }

  return {
    fechaInicio: new Date(Date.UTC(year, month - 1, 1)),
    fechaFin: new Date(Date.UTC(year, month, 0)),
    mes: `${year}-${String(month).padStart(2, "0")}`,
  };
}

async function getMyAttendanceAccess(req) {
  const idUsuario = req.user.id_usuario;
  const branchIds = await getEmployeeBranchIds(idUsuario);
  return branchIds.length > 0 ? { idUsuario, branchIds } : null;
}

async function getMyAttendanceSummary(req, res) {
  try {
    const access = await getMyAttendanceAccess(req);
    if (!access) {
      return res.status(403).json({ error: "El usuario no está asignado a una sucursal" });
    }

    const range = getMonthRange(req.query);
    if (!range) {
      return res.status(400).json({ error: "Mes o año inválidos" });
    }

    const total = await prisma.asistencia.aggregate({
      _sum: { horas_faltadas: true },
      where: {
        id_usuario: access.idUsuario,
        id_sucursal: { in: access.branchIds },
        fecha: { gte: range.fechaInicio, lte: range.fechaFin },
      },
    });

    return res.json({ mes: range.mes, horas_faltadas: total._sum.horas_faltadas || 0 });
  } catch (error) {
    console.error("Error obteniendo resumen personal de asistencia:", error);
    return res.status(500).json({ error: "Error obteniendo resumen de asistencia" });
  }
}

async function getMyAttendanceRecords(req, res) {
  try {
    const access = await getMyAttendanceAccess(req);
    if (!access) {
      return res.status(403).json({ error: "El usuario no está asignado a una sucursal" });
    }

    const defaultStart = todayDateString().slice(0, 8) + "01";
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : defaultStart,
    );
    const fechaFin = parseDateOnly(
      typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : todayDateString(),
    );

    const registros = await prisma.asistencia.findMany({
      where: {
        id_usuario: access.idUsuario,
        id_sucursal: { in: access.branchIds },
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      include: { usuario: true, sucursal: true },
      orderBy: { fecha: "asc" },
    });

    return res.json(registros.map(mapAttendance));
  } catch (error) {
    console.error("Error obteniendo asistencia personal:", error);
    return res.status(500).json({ error: "Error obteniendo asistencia personal" });
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
  getMyAttendanceSummary,
  getMyAttendanceRecords,
};
