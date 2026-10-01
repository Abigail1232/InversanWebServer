const prisma = require("../config/database");
const { calculateAttendancePenalty } = require("../Services/attendancePenalty");
const {
  formatBusinessDate,
  getBusinessMonthRange,
  getCurrentBusinessDate,
  getCurrentBusinessTime,
} = require("../Services/businessDate");
const { validateLocation } = require("../Services/geofence");
const { decryptEmbedding } = require("../Services/biometricCrypto");
const { CURRENT_FACE_MODEL_VERSION } = require("../Services/faceModel");

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

function canAdministerBiometrics(req) {
  return hasPrivilege(req, "ASI_BIOMETRIA_ADMINISTRAR");
}

function isCodedError(error, code) {
  return error instanceof Error && error.code === code;
}

function biometricReenrollmentRequired() {
  const error = new Error("BIOMETRIC_REENROLLMENT_REQUIRED");
  error.code = "BIOMETRIC_REENROLLMENT_REQUIRED";
  return error;
}

function sendBiometricEncryptionNotConfigured(res) {
  return res.status(503).json({
    code: "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED",
    error: "El servicio biométrico todavía no está configurado.",
  });
}

function sendFaceServiceUnavailable(res) {
  return res.status(503).json({
    code: "FACE_SERVICE_UNAVAILABLE",
    error: "El servicio de reconocimiento facial no está disponible.",
  });
}

function sendBiometricDisabled(res) {
  return res.status(503).json({
    code: "BIOMETRIC_DISABLED",
    error: "La asistencia biométrica no está habilitada.",
  });
}

function sendSelfBiometricEnrollmentDisabled(res) {
  return res.status(403).json({
    code: "SELF_BIOMETRIC_ENROLLMENT_DISABLED",
    error: "El registro facial debe realizarlo un administrador.",
  });
}

function sendBiometricReenrollmentRequired(res) {
  return res.status(409).json({
    code: "BIOMETRIC_REENROLLMENT_REQUIRED",
    error: "Tu registro facial necesita actualizarse. Solicita al administrador que registre nuevamente tu rostro.",
  });
}

function sendFaceQualityInsufficient(res) {
  return res.status(422).json({
    code: "FACE_QUALITY_INSUFFICIENT",
    error: "La foto no tiene suficiente calidad. Inténtalo nuevamente.",
  });
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

function parseDateOnly(value, fallback = formatBusinessDate()) {
  const raw = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
  return new Date(`${raw}T00:00:00.000Z`);
}

function dateToString(value) {
  if (!value) return "";
  return formatBusinessDate(new Date(value));
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

function mapSelfServiceBranch(assignment) {
  return {
    id: assignment.id_sucursal,
    nombre: assignment.sucursal.nombre,
    locationConfigured: Boolean(assignment.sucursal.location_configured),
    radiusMeters: assignment.sucursal.attendance_radius_m,
    maxGpsAccuracyMeters: assignment.sucursal.max_gps_accuracy_m,
  };
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
    const currentBusinessDate = formatBusinessDate();
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : `${currentBusinessDate.slice(0, 8)}01`,
    );
    const fechaFin = parseDateOnly(typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : currentBusinessDate);

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
    const currentBusinessDate = formatBusinessDate();
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : `${currentBusinessDate.slice(0, 8)}01`,
    );
    const fechaFin = parseDateOnly(typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : currentBusinessDate);

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
  return getBusinessMonthRange(query);
}

async function getMyAttendanceAccess(req) {
  const idUsuario = req.user.id_usuario;
  const branchIds = await getEmployeeBranchIds(idUsuario);
  return branchIds.length > 0 ? { idUsuario, branchIds } : null;
}

async function verifyMyAttendanceLocation(req, res) {
  try {
    const assignment = await getSelfServiceBranch(req, parseId(req.body?.id_sucursal));

    if (!assignment) {
      return res.status(200).json({ allowed: false, code: "BRANCH_NOT_ASSIGNED", reason: "BRANCH_NOT_ASSIGNED" });
    }
    if (assignment.multiple) {
      return res.status(409).json({ allowed: false, code: "MULTIPLE_BRANCHES_SELECT_REQUIRED", reason: "MULTIPLE_BRANCHES_SELECT_REQUIRED", branches: assignment.branches });
    }

    const result = validateLocation(req.body || {}, assignment.sucursal);
    if (!result.allowed) {
      return res.json({ allowed: false, code: result.reason, reason: result.reason, accuracyMeters: result.accuracyMeters, maxAccuracyMeters: result.maxAccuracyMeters, distanceMeters: result.distanceMeters, radiusMeters: result.radiusMeters });
    }

    return res.json({
      allowed: true,
      branch: {
        id: assignment.sucursal.id_sucursal,
        nombre: assignment.sucursal.nombre,
      },
      distanceMeters: result.distanceMeters,
      radiusMeters: result.radiusMeters,
      accuracyMeters: result.accuracyMeters,
    });
  } catch (error) {
    console.error("Error verificando ubicación de asistencia:", error);
    return res.status(500).json({ error: "No se pudo verificar la ubicación" });
  }
}

async function getMyCheckinStatus(req, res) {
  try {
    const assignment = await getSelfServiceBranch(req, parseId(req.query?.id_sucursal));
    const selfEnrollmentEnabled = isSelfBiometricEnrollmentEnabled();
    if (!assignment) return res.json({ eligible: false, code: "BRANCH_NOT_ASSIGNED", biometric: { registered: false, status: "NOT_REGISTERED", selfEnrollmentEnabled }, attendance: { alreadyMarkedToday: false } });
    if (assignment.multiple) {
      return res.json({
        eligible: false,
        code: "MULTIPLE_BRANCHES_SELECT_REQUIRED",
        branches: assignment.branches,
        biometric: { registered: false, status: "NOT_REGISTERED", selfEnrollmentEnabled },
        attendance: { alreadyMarkedToday: false },
      });
    }

    const biometric = await prisma.biometria_Facial.findUnique({ where: { id_usuario: req.user.id_usuario }, select: { activo: true, model_version: true } });
    const pending = await prisma.solicitud_Biometria.findFirst({ where: { id_usuario: req.user.id_usuario, status: "PENDING" }, select: { id_solicitud: true } });
    const attendance = await prisma.asistencia.findUnique({ where: { id_usuario_id_sucursal_fecha: { id_usuario: req.user.id_usuario, id_sucursal: assignment.id_sucursal, fecha: getCurrentBusinessDate() } }, select: { id_asistencia: true } });
    const biometricStatus = biometric?.activo && biometric.model_version !== CURRENT_FACE_MODEL_VERSION ? "REENROLLMENT_REQUIRED" : biometric?.activo ? "ACTIVE" : biometric ? "DISABLED" : pending ? "PENDING" : "NOT_REGISTERED";
    const locationConfigured = Boolean(assignment.sucursal.location_configured);
    return res.json({
      eligible: locationConfigured && biometricStatus === "ACTIVE" && !attendance,
      branch: mapSelfServiceBranch(assignment),
      biometric: { registered: biometricStatus === "ACTIVE", status: biometricStatus, selfEnrollmentEnabled },
      attendance: { alreadyMarkedToday: Boolean(attendance) },
      code: attendance ? "ATTENDANCE_ALREADY_REGISTERED" : biometricStatus === "PENDING" ? "BIOMETRIC_PENDING" : biometricStatus === "NOT_REGISTERED" ? "BIOMETRIC_NOT_REGISTERED" : biometricStatus === "DISABLED" ? "BIOMETRIC_DISABLED" : biometricStatus === "REENROLLMENT_REQUIRED" ? "BIOMETRIC_REENROLLMENT_REQUIRED" : !locationConfigured ? "BRANCH_LOCATION_NOT_CONFIGURED" : undefined,
    });
  } catch (error) {
    console.error("Error obteniendo estado de check-in:", error);
    return res.status(500).json({ code: "CHECKIN_STATUS_ERROR", error: "No se pudo obtener el estado de marcación" });
  }
}

const PASSIVE_LIVENESS_ACTIONS = ["PASSIVE_MOTION"];

function isBiometricEnabled() {
  return process.env.BIOMETRIC_ENABLED === "true";
}

function isSelfBiometricEnrollmentEnabled() {
  return process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED === "true";
}

async function getSelfServiceBranch(req, requestedBranchId = null) {
  const assignments = await prisma.empleado_Sucursal.findMany({
    where: { id_usuario: req.user.id_usuario, usuario: { activo: true }, sucursal: { activo: true } },
    include: { sucursal: true },
  });

  if (assignments.length === 0) return null;

  if (requestedBranchId) {
    return assignments.find((assignment) => assignment.id_sucursal === requestedBranchId) || null;
  }

  if (assignments.length > 1) {
    return { multiple: true, branches: assignments.map(mapSelfServiceBranch) };
  }

  return assignments[0];
}

async function createLivenessChallenge(req, res) {
  try {
    if (!isBiometricEnabled()) return sendBiometricDisabled(res);
    const redis = require("../middleware/redisConfig");
    const assignment = await getSelfServiceBranch(req, parseId(req.body?.id_sucursal));
    if (!assignment) return res.status(403).json({ code: "BRANCH_NOT_ASSIGNED", error: "El usuario no está asignado a una sucursal activa" });

    if (assignment.multiple) return res.status(409).json({ code: "MULTIPLE_BRANCHES_SELECT_REQUIRED", error: "Selecciona la sucursal para marcar asistencia", branches: assignment.branches });

    const biometric = await prisma.biometria_Facial.findUnique({ where: { id_usuario: req.user.id_usuario } });
    if (!biometric || !biometric.activo) return res.status(409).json({ code: biometric ? "BIOMETRIC_DISABLED" : "BIOMETRIC_NOT_REGISTERED", error: "Tu reconocimiento facial todavía no está configurado. Contacta a un administrador." });

    const location = validateLocation(req.body || {}, assignment.sucursal);
    if (!location.allowed) return res.status(400).json({ allowed: false, code: location.reason, reason: location.reason, accuracyMeters: location.accuracyMeters, maxAccuracyMeters: location.maxAccuracyMeters, distanceMeters: location.distanceMeters, radiusMeters: location.radiusMeters });

    const challengeId = require("node:crypto").randomUUID();
    const ttl = Number(process.env.LIVENESS_CHALLENGE_TTL_SECONDS || 90);
    const challenge = {
      userId: req.user.id_usuario,
      branchId: assignment.id_sucursal,
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      accuracy: location.accuracyMeters,
      distanceMeters: location.distanceMeters,
      actions: PASSIVE_LIVENESS_ACTIONS,
      livenessMode: "PASSIVE_MOTION",
      used: false,
    };
    await redis.set(`attendance:liveness:${challengeId}`, JSON.stringify(challenge), "EX", ttl);
    return res.json({ challenge_id: challengeId, actions: challenge.actions, liveness_mode: challenge.livenessMode, expires_in_seconds: ttl });
  } catch (error) {
    console.error("Error generando challenge de asistencia:", error);
    return res.status(500).json({ error: "No se pudo iniciar la verificación" });
  }
}

async function faceCheckIn(req, res) {
  try {
    if (!isBiometricEnabled()) return sendBiometricDisabled(res);
    const redis = require("../middleware/redisConfig");
    const { verifyFace, verifyLiveness } = require("../Services/faceService");
    const attemptsKey = `attendance:biometric:attempts:${req.user.id_usuario}`;
    const attempts = Number(await redis.get(attemptsKey) || 0);
    const maxAttempts = Number(process.env.BIOMETRIC_MAX_ATTEMPTS || 5);
    if (attempts >= maxAttempts) return res.status(429).json({ error: "Demasiados intentos fallidos. Inténtalo más tarde." });
    const challengeId = typeof req.body?.challenge_id === "string" ? req.body.challenge_id : "";
    const imageBase64 = typeof req.body?.image_base64 === "string" ? req.body.image_base64 : "";
    const frames = Array.isArray(req.body?.frames) ? req.body.frames : [];
    if (!challengeId || !imageBase64 || frames.length < 2) return res.status(400).json({ error: "Evidencia biométrica incompleta" });

    const key = `attendance:liveness:${challengeId}`;
    const rawChallenge = await redis.getdel(key);
    if (!rawChallenge) return res.status(409).json({ code: "CHALLENGE_EXPIRED", error: "El challenge expiró o ya fue utilizado" });
    const challenge = JSON.parse(rawChallenge);
    if (challenge.userId !== req.user.id_usuario || challenge.used) return res.status(403).json({ code: "CHALLENGE_INVALID", error: "Challenge inválido" });

    const assignment = await getSelfServiceBranch(req, challenge.branchId);
    if (!assignment || assignment.id_sucursal !== challenge.branchId) return res.status(403).json({ code: "BRANCH_NOT_ASSIGNED", error: "La sucursal de la sesión no coincide" });
    const livenessActions = Array.isArray(challenge.actions) && challenge.actions.length ? challenge.actions : PASSIVE_LIVENESS_ACTIONS;
    if (frames.length < 2) return res.status(400).json({ code: "LIVENESS_EVIDENCE_INCOMPLETE", error: "Evidencia de liveness incompleta" });
    const location = validateLocation(req.body.location || {}, assignment.sucursal);
    if (!location.allowed) return res.status(400).json({ allowed: false, code: location.reason, reason: location.reason, accuracyMeters: location.accuracyMeters, maxAccuracyMeters: location.maxAccuracyMeters, distanceMeters: location.distanceMeters, radiusMeters: location.radiusMeters });
    if (
      location.latitude !== challenge.latitude
      || location.longitude !== challenge.longitude
      || location.accuracyMeters !== challenge.accuracy
    ) return res.status(409).json({ error: "La ubicación no coincide con el challenge" });

    const biometric = await prisma.biometria_Facial.findUnique({ where: { id_usuario: req.user.id_usuario } });
    if (!biometric || !biometric.activo) return res.status(409).json({ code: biometric ? "BIOMETRIC_DISABLED" : "BIOMETRIC_NOT_REGISTERED", error: "Tu reconocimiento facial todavía no está configurado. Contacta a un administrador." });

    if (biometric?.activo && biometric.model_version !== CURRENT_FACE_MODEL_VERSION) throw biometricReenrollmentRequired();

    const liveness = await verifyLiveness(frames, livenessActions);
    if (!liveness.verified) {
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 900);
      return res.status(422).json({ code: "LIVENESS_FAILED", error: "No se pudo comprobar la prueba de vida" });
    }
    const verification = await verifyFace(imageBase64, decryptEmbedding(biometric.embedding));
    if (!verification.matched) {
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 900);
      return res.status(422).json({ code: "FACE_NOT_MATCHED", error: "El rostro no coincide" });
    }

    const fecha = getCurrentBusinessDate();
    const horaEntrada = getCurrentBusinessTime();
    const penalty = calculateAttendancePenalty(horaEntrada);
    const saved = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.asistencia.findUnique({
        where: { id_usuario_id_sucursal_fecha: { id_usuario: req.user.id_usuario, id_sucursal: assignment.id_sucursal, fecha } },
      });
      if (existing) return null;
      const attendance = await transaction.asistencia.create({
        data: {
          id_usuario: req.user.id_usuario,
          id_sucursal: assignment.id_sucursal,
          fecha,
          hora_entrada: horaEntrada,
          horas_faltadas: penalty.horas_faltadas,
          categoria: penalty.categoria,
          attendance_method: "FACE_GPS",
          gps_latitude: location.latitude,
          gps_longitude: location.longitude,
          gps_accuracy_m: location.accuracyMeters,
          distance_from_branch_m: location.distanceMeters,
          face_verified: true,
          face_similarity: Number(verification.similarity),
          liveness_verified: true,
          verified_at: new Date(),
          registrado_por: req.user.id_usuario,
          actualizado_por: req.user.id_usuario,
        },
        include: { usuario: true, sucursal: true },
      });
      await transaction.biometria_Facial.update({
        where: { id_usuario: req.user.id_usuario },
        data: { last_verified_at: new Date() },
      });
      return attendance;
    });
    if (!saved) return res.status(409).json({ code: "ATTENDANCE_ALREADY_REGISTERED", error: "Tu asistencia de hoy ya fue registrada" });
    await redis.del(attemptsKey);
    return res.status(201).json({ mensaje: "¡Asistencia registrada correctamente!", data: mapAttendance(saved), verification: { distanceMeters: location.distanceMeters, similarity: Number(verification.similarity) } });
  } catch (error) {
    console.error("Error registrando asistencia biométrica:", error);
    if (isCodedError(error, "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED")) return sendBiometricEncryptionNotConfigured(res);
    if (isCodedError(error, "BIOMETRIC_REENROLLMENT_REQUIRED")) return sendBiometricReenrollmentRequired(res);
    if (isCodedError(error, "FACE_SERVICE_UNAVAILABLE")) return sendFaceServiceUnavailable(res);
    if (isCodedError(error, "FACE_QUALITY_INSUFFICIENT")) return sendFaceQualityInsufficient(res);
    return res.status(500).json({ code: "BIOMETRIC_REQUEST_ERROR", error: "No se pudo registrar la asistencia biométrica" });
  }
}

async function registerBiometric(req, res) {
  try {
    if (!canAdministerBiometrics(req)) return res.status(403).json({ error: "No tiene privilegio para administrar biometría" });
    const idUsuario = parseId(req.body?.id_usuario);
    const imageBase64 = typeof req.body?.image_base64 === "string" ? req.body.image_base64 : "";
    if (!idUsuario || !imageBase64) return res.status(400).json({ error: "Empleado e imagen son obligatorios" });
    const assignment = await prisma.empleado_Sucursal.findFirst({ where: { id_usuario: idUsuario, usuario: { activo: true }, sucursal: { activo: true } } });
    if (!assignment) return res.status(404).json({ error: "El empleado no está asignado a una sucursal activa" });
    const { createEmbedding } = require("../Services/faceService");
    const result = await createEmbedding(imageBase64);
    if (result.face_count !== 1 || !result.quality_ok) return res.status(422).json({ code: "FACE_QUALITY_INSUFFICIENT", error: "La foto no tiene suficiente calidad. Inténtalo nuevamente." });
    const { encryptEmbedding } = require("../Services/biometricCrypto");
    await prisma.biometria_Facial.upsert({
      where: { id_usuario: idUsuario },
      create: { id_usuario: idUsuario, embedding: encryptEmbedding(result.embedding), model_version: result.model_version, registered_by: req.user.id_usuario, activo: true },
      update: { embedding: encryptEmbedding(result.embedding), model_version: result.model_version, registered_by: req.user.id_usuario, activo: true },
    });
    return res.status(201).json({ mensaje: "Rostro registrado correctamente" });
  } catch (error) {
    console.error("Error registrando biometría:", error);
    if (isCodedError(error, "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED")) return sendBiometricEncryptionNotConfigured(res);
    if (isCodedError(error, "FACE_SERVICE_UNAVAILABLE")) return sendFaceServiceUnavailable(res);
    if (isCodedError(error, "FACE_QUALITY_INSUFFICIENT")) return sendFaceQualityInsufficient(res);
    return res.status(500).json({ code: "BIOMETRIC_REQUEST_ERROR", error: "No se pudo registrar el rostro" });
  }
}

async function requestBiometricRegistration(req, res) {
  try {
    if (!isBiometricEnabled()) return sendBiometricDisabled(res);
    if (!isSelfBiometricEnrollmentEnabled()) return sendSelfBiometricEnrollmentDisabled(res);
    const assignment = await getSelfServiceBranch(req, parseId(req.body?.id_sucursal));
    if (!assignment) return res.status(403).json({ code: "BRANCH_NOT_ASSIGNED", error: "No estás asignado a una sucursal activa" });
    if (assignment.multiple) return res.status(409).json({ code: "MULTIPLE_BRANCHES_SELECT_REQUIRED", error: "Selecciona una sucursal para solicitar registro biomÃ©trico", branches: assignment.branches });
    const existing = await prisma.biometria_Facial.findUnique({ where: { id_usuario: req.user.id_usuario }, select: { activo: true } });
    if (existing?.activo) return res.status(409).json({ code: "BIOMETRIC_ACTIVE", error: "Tu reconocimiento facial ya está configurado" });
    const pending = await prisma.solicitud_Biometria.findFirst({ where: { id_usuario: req.user.id_usuario, status: "PENDING" }, select: { id_solicitud: true } });
    if (pending) return res.status(409).json({ code: "BIOMETRIC_PENDING", error: "Tu registro facial está pendiente de aprobación" });
    const imageBase64 = typeof req.body?.image_base64 === "string" ? req.body.image_base64 : "";
    if (!imageBase64) return res.status(400).json({ code: "IMAGE_REQUIRED", error: "La captura facial es obligatoria" });
    const { createEmbedding } = require("../Services/faceService");
    const result = await createEmbedding(imageBase64);
    if (result.face_count !== 1 || !result.quality_ok) return res.status(422).json({ code: "FACE_QUALITY_INSUFFICIENT", error: "La foto no tiene suficiente calidad. Inténtalo nuevamente." });
    const { encryptEmbedding } = require("../Services/biometricCrypto");
    const request = await prisma.solicitud_Biometria.create({ data: { id_usuario: req.user.id_usuario, embedding_encrypted: encryptEmbedding(result.embedding), model_version: result.model_version, status: "PENDING" } });
    return res.status(201).json({ id_solicitud: request.id_solicitud, status: request.status });
  } catch (error) {
    console.error("Error solicitando registro biométrico:", error);
    if (isCodedError(error, "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED")) return sendBiometricEncryptionNotConfigured(res);
    if (isCodedError(error, "FACE_SERVICE_UNAVAILABLE")) return sendFaceServiceUnavailable(res);
    if (isCodedError(error, "FACE_QUALITY_INSUFFICIENT")) return sendFaceQualityInsufficient(res);
    return res.status(500).json({ code: "BIOMETRIC_REQUEST_ERROR", error: "No se pudo enviar la solicitud facial" });
  }
}

async function getBiometricRequests(req, res) {
  try {
    if (!canAdministerBiometrics(req)) return res.status(403).json({ error: "No tiene privilegio para administrar biometría" });
    const requests = await prisma.solicitud_Biometria.findMany({
      where: { status: "PENDING" },
      select: { id_solicitud: true, id_usuario: true, status: true, created_at: true, usuario: { select: { primer_nombre: true, primer_apellido: true, empleado_sucursal: { select: { sucursal: { select: { nombre: true } } } } } } },
      orderBy: { created_at: "asc" },
    });
    return res.json(requests.map((request) => ({ id_solicitud: request.id_solicitud, id_usuario: request.id_usuario, empleado: `${request.usuario.primer_nombre} ${request.usuario.primer_apellido}`, sucursal: request.usuario.empleado_sucursal[0]?.sucursal.nombre || "", status: request.status, created_at: request.created_at })));
  } catch (error) {
    console.error("Error obteniendo solicitudes biométricas:", error);
    return res.status(500).json({ error: "No se pudieron obtener las solicitudes" });
  }
}

async function reviewBiometricRequest(req, res) {
  try {
    if (!canAdministerBiometrics(req)) return res.status(403).json({ error: "No tiene privilegio para administrar biometría" });
    const idSolicitud = parseId(req.params.idSolicitud);
    const decision = req.params.decision === "approve" ? "APPROVED" : req.params.decision === "reject" ? "REJECTED" : null;
    if (!idSolicitud || !decision) return res.status(400).json({ error: "Solicitud o decisión inválida" });
    const result = await prisma.$transaction(async (transaction) => {
      const request = await transaction.solicitud_Biometria.findUnique({ where: { id_solicitud: idSolicitud } });
      if (!request || request.status !== "PENDING") return null;
      if (decision === "APPROVED" && !request.embedding_encrypted) return { missingEmbedding: true };
      if (decision === "APPROVED" && request.model_version !== CURRENT_FACE_MODEL_VERSION) return { reenrollmentRequired: true };
      if (decision === "APPROVED") {
        await transaction.biometria_Facial.upsert({ where: { id_usuario: request.id_usuario }, create: { id_usuario: request.id_usuario, embedding: request.embedding_encrypted, model_version: request.model_version, registered_by: req.user.id_usuario, activo: true }, update: { embedding: request.embedding_encrypted, model_version: request.model_version, registered_by: req.user.id_usuario, activo: true } });
      }
      return transaction.solicitud_Biometria.update({ where: { id_solicitud: idSolicitud }, data: { status: decision, reviewed_by: req.user.id_usuario, reviewed_at: new Date(), embedding_encrypted: null }, select: { id_solicitud: true, status: true } });
    });
    if (!result) return res.status(409).json({ code: "BIOMETRIC_REQUEST_ALREADY_REVIEWED", error: "La solicitud ya fue revisada" });
    if (result.missingEmbedding) return res.status(409).json({ code: "BIOMETRIC_REQUEST_EMBEDDING_MISSING", error: "La solicitud no conserva evidencia biometrica revisable" });
    if (result.reenrollmentRequired) return res.status(409).json({ code: "BIOMETRIC_REENROLLMENT_REQUIRED", error: "Esta solicitud fue creada con un modelo facial anterior. El empleado debe registrar nuevamente su rostro." });
    return res.json(result);
  } catch (error) {
    console.error("Error revisando solicitud biométrica:", error);
    return res.status(500).json({ error: "No se pudo revisar la solicitud" });
  }
}

async function deactivateBiometric(req, res) {
  try {
    if (!canAdministerBiometrics(req)) return res.status(403).json({ error: "No tiene privilegio para administrar biometría" });
    const idUsuario = parseId(req.params.idUsuario);
    if (!idUsuario) return res.status(400).json({ error: "Empleado inválido" });
    await prisma.biometria_Facial.updateMany({ where: { id_usuario: idUsuario }, data: { activo: false } });
    return res.json({ mensaje: "Biometría desactivada correctamente" });
  } catch (error) {
    console.error("Error desactivando biometría:", error);
    return res.status(500).json({ error: "No se pudo desactivar la biometría" });
  }
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

    const currentBusinessDate = formatBusinessDate();
    const defaultStart = `${currentBusinessDate.slice(0, 8)}01`;
    const fechaInicio = parseDateOnly(
      typeof req.query.fecha_inicio === "string" ? req.query.fecha_inicio : defaultStart,
    );
    const fechaFin = parseDateOnly(
      typeof req.query.fecha_fin === "string" ? req.query.fecha_fin : currentBusinessDate,
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
  verifyMyAttendanceLocation,
  getMyCheckinStatus,
  createLivenessChallenge,
  faceCheckIn,
  registerBiometric,
  deactivateBiometric,
  requestBiometricRegistration,
  getBiometricRequests,
  reviewBiometricRequest,
};
