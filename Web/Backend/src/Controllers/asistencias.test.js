const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

const prisma = {
  empleado_Sucursal: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  sucursal: { findMany: async () => [] },
  biometria_Facial: { findUnique: async () => null },
  solicitud_Biometria: { findFirst: async () => null },
  asistencia: {
    aggregate: async () => ({ _sum: { horas_faltadas: 0 } }),
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
  },
  $transaction: async (callback) => callback(prisma),
};

const databasePath = require.resolve("../config/database");
const databaseModule = new Module(databasePath);
databaseModule.filename = databasePath;
databaseModule.loaded = true;
databaseModule.exports = prisma;
require.cache[databasePath] = databaseModule;

const businessDateService = require("../Services/businessDate");
businessDateService.getCurrentBusinessDate = () => new Date("2026-09-26T00:00:00.000Z");

const attendanceController = require("./asistencias");
const { PRIVILEGIOS } = require("../config/privileges");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function allowOneBranch(branchId = 3) {
  prisma.empleado_Sucursal.findMany = async ({ where }) =>
    where.id_usuario !== undefined ? [{ id_sucursal: branchId }] : [];
  prisma.sucursal.findMany = async () => [];
}

test("attendance controller enforces branch and self-service access", async (t) => {
  await t.test("biometric endpoints are disabled unless BIOMETRIC_ENABLED is exactly true", async () => {
    const previous = process.env.BIOMETRIC_ENABLED;
    delete process.env.BIOMETRIC_ENABLED;

    const challengeResponse = createResponse();
    await attendanceController.createLivenessChallenge({ user: { id_usuario: 7 }, body: {} }, challengeResponse);
    assert.equal(challengeResponse.statusCode, 503);
    assert.equal(challengeResponse.body.code, "BIOMETRIC_DISABLED");

    process.env.BIOMETRIC_ENABLED = "false";
    const checkInResponse = createResponse();
    await attendanceController.faceCheckIn({ user: { id_usuario: 7 }, body: {} }, checkInResponse);
    assert.equal(checkInResponse.statusCode, 503);
    assert.equal(checkInResponse.body.code, "BIOMETRIC_DISABLED");

    if (previous === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previous;
  });

  await t.test("ASI_MARCAR creates an attendance when no record exists", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [];
    let createdData;
    let updateCalled = false;
    prisma.asistencia.create = async ({ data }) => {
      createdData = data;
      return {
        id_asistencia: 5,
        ...data,
        usuario: { id_usuario: 7, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz" },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };
    prisma.asistencia.update = async () => {
      updateCalled = true;
      return null;
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        body: { id_sucursal: 3, fecha: "2026-09-20", asistencias: [{ id_usuario: 7, hora_entrada: "07:25" }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(createdData.fecha.toISOString(), "2026-09-26T00:00:00.000Z");
    assert.equal(createdData.categoria, "puntual");
    assert.equal(createdData.horas_faltadas, 0);
    assert.equal(res.body.fecha, "2026-09-26");
    assert.equal(updateCalled, false);
  });

  await t.test("future request date is ignored when creating attendance", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [];
    let createdData;
    prisma.asistencia.create = async ({ data }) => {
      createdData = data;
      return {
        id_asistencia: 6,
        ...data,
        usuario: { id_usuario: 7, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz" },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        body: { id_sucursal: 3, fecha: "2030-01-01", asistencias: [{ id_usuario: 7, hora_entrada: "07:25" }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(createdData.fecha.toISOString(), "2026-09-26T00:00:00.000Z");
  });

  await t.test("missing request date still creates attendance for Honduras today", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [];
    let createdData;
    prisma.asistencia.create = async ({ data }) => {
      createdData = data;
      return {
        id_asistencia: 7,
        ...data,
        usuario: { id_usuario: 7, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz" },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        body: { id_sucursal: 3, asistencias: [{ id_usuario: 7, hora_entrada: "07:25" }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(createdData.fecha.toISOString(), "2026-09-26T00:00:00.000Z");
  });

  await t.test("daily attendance lookup ignores a requested historical date", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{
        id_usuario: 7,
        usuario: { id_usuario: 7, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz", activo: true },
      }] : [{ id_sucursal: 3 }];
    let queriedWhere;
    prisma.asistencia.findMany = async ({ where }) => {
      queriedWhere = where;
      return [];
    };

    const res = createResponse();
    await attendanceController.getAttendanceDay(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        query: { id_sucursal: "3", fecha: "2020-01-01" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.fecha, "2026-09-26");
    assert.equal(queriedWhere.fecha.toISOString(), "2026-09-26T00:00:00.000Z");
  });

  await t.test("ASI_MARCAR cannot change an existing attendance", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [{
      id_asistencia: 5,
      id_usuario: 7,
      id_sucursal: 3,
      fecha: new Date("2026-09-26T00:00:00.000Z"),
      hora_entrada: "07:25",
      horas_faltadas: 0,
      categoria: "puntual",
      observacion: null,
    }];
    let updateCalled = false;
    prisma.asistencia.update = async () => {
      updateCalled = true;
      return null;
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        body: { id_sucursal: 3, fecha: "2030-01-01", asistencias: [{ id_usuario: 7, hora_entrada: "08:00" }] },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(updateCalled, false);
  });

  await t.test("ASI_MARCAR and ASI_EDITAR can update and recalculate an existing attendance", async () => {
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [{
      id_asistencia: 5,
      id_usuario: 7,
      id_sucursal: 3,
      fecha: new Date("2026-09-26T00:00:00.000Z"),
      hora_entrada: "07:25",
      horas_faltadas: 0,
      categoria: "puntual",
      observacion: null,
    }];
    let updatedData;
    prisma.asistencia.update = async ({ data }) => {
      updatedData = data;
      return {
        id_asistencia: 5,
        id_usuario: 7,
        id_sucursal: 3,
        fecha: new Date("2026-09-25T00:00:00.000Z"),
        ...data,
        usuario: { id_usuario: 7, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz" },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR", "ASI_EDITAR"],
        body: { id_sucursal: 3, fecha: "2030-01-01", asistencias: [{ id_usuario: 7, hora_entrada: "08:00" }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(updatedData.categoria, "falta_jornada");
    assert.equal(updatedData.horas_faltadas, 8);
  });

  await t.test("ASI_MARCAR can submit unchanged existing attendance as a no-op", async () => {
    const existing = {
      id_asistencia: 5,
      id_usuario: 7,
      id_sucursal: 3,
      fecha: new Date("2026-09-26T00:00:00.000Z"),
      hora_entrada: "07:25",
      horas_faltadas: 0,
      categoria: "puntual",
      observacion: null,
    };
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_sucursal ? [{ id_usuario: 7 }] : [{ id_sucursal: 3 }];
    prisma.asistencia.findMany = async () => [existing];
    let writeCalled = false;
    prisma.asistencia.create = async () => {
      writeCalled = true;
      return null;
    };
    prisma.asistencia.update = async () => {
      writeCalled = true;
      return null;
    };

    const res = createResponse();
    await attendanceController.markAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_MARCAR"],
        body: { id_sucursal: 3, fecha: "2026-09-20", asistencias: [{ id_usuario: 7, hora_entrada: "07:25", observacion: null }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(writeCalled, false);
    assert.equal(res.body.data[0].id_asistencia, existing.id_asistencia);
  });

  await t.test("report query rejects a branch outside the authenticated user's assignments", async () => {
    allowOneBranch(3);
    let employeeQueryCount = 0;
    prisma.empleado_Sucursal.findMany = async ({ where }) => {
      if (where.id_usuario !== undefined) return [{ id_sucursal: 3 }];
      employeeQueryCount += 1;
      return [];
    };

    const res = createResponse();
    await attendanceController.getAttendanceReports(
      { user: { id_usuario: 12 }, userPrivileges: ["ASI_MARCAR"], query: { id_sucursal: "4" } },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(employeeQueryCount, 0);
  });

  await t.test("report attendance query only includes assigned employees", async () => {
    const employee = {
      id_usuario: 7,
      usuario: {
        id_usuario: 7,
        usuario: "empleado",
        primer_nombre: "Ana",
        primer_apellido: "Paz",
      },
      sucursal: { nombre: "Central" },
    };
    allowOneBranch(3);
    prisma.empleado_Sucursal.findMany = async ({ where }) =>
      where.id_usuario !== undefined ? [{ id_sucursal: 3 }] : [employee];
    let queriedUserIds;
    prisma.asistencia.findMany = async ({ where }) => {
      queriedUserIds = where.id_usuario.in;
      return [];
    };

    const res = createResponse();
    await attendanceController.getAttendanceReports(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_REPORTES"],
        query: { id_sucursal: "3", fecha_inicio: "2026-09-01", fecha_fin: "2026-09-25" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(queriedUserIds, [7]);
  });

  await t.test("ALL_ACCESS can report on a branch outside an assigned branch", async () => {
    const employee = {
      id_usuario: 8,
      usuario: {
        id_usuario: 8,
        usuario: "empleado-admin",
        primer_nombre: "Luis",
        primer_apellido: "Reyes",
      },
      sucursal: { nombre: "Norte" },
    };
    prisma.empleado_Sucursal.findMany = async () => [employee];
    let requestedBranch;
    prisma.asistencia.findMany = async ({ where }) => {
      requestedBranch = where.id_sucursal;
      return [];
    };

    const res = createResponse();
    await attendanceController.getAttendanceReports(
      {
        user: { id_usuario: 1 },
        userPrivileges: ["ALL_ACCESS"],
        query: { id_sucursal: "4", fecha_inicio: "2026-09-01", fecha_fin: "2026-09-25" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(requestedBranch, 4);
  });

  await t.test("weekly report rejects a target employee not assigned to that branch", async () => {
    allowOneBranch(3);
    prisma.empleado_Sucursal.findUnique = async () => null;
    prisma.asistencia.findMany = async () => {
      throw new Error("attendance records should not be queried");
    };

    const res = createResponse();
    await attendanceController.getUserAttendanceRecords(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_REPORTES"],
        params: { idUsuario: "99" },
        query: { id_sucursal: "3" },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
  });

  await t.test("self summary ignores caller-supplied employee IDs", async () => {
    allowOneBranch(3);
    let queriedWhere;
    prisma.asistencia.aggregate = async ({ where }) => {
      queriedWhere = where;
      return { _sum: { horas_faltadas: 3 } };
    };

    const res = createResponse();
    await attendanceController.getMyAttendanceSummary(
      {
        user: { id_usuario: 5 },
        query: { id_usuario: "99", employee_id: "99", mes: "9", anio: "2026" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.horas_faltadas, 3);
    assert.equal(queriedWhere.id_usuario, 5);
    assert.deepEqual(queriedWhere.id_sucursal.in, [3]);
    assert.equal(queriedWhere.fecha.gte.toISOString(), "2026-09-01T00:00:00.000Z");
    assert.equal(queriedWhere.fecha.lte.toISOString(), "2026-09-30T00:00:00.000Z");
  });

  await t.test("self history ignores caller-supplied employee IDs", async () => {
    allowOneBranch(3);
    let queriedWhere;
    prisma.asistencia.findMany = async ({ where }) => {
      queriedWhere = where;
      return [];
    };

    const res = createResponse();
    await attendanceController.getMyAttendanceRecords(
      {
        user: { id_usuario: 5 },
        query: {
          employee_id: "99",
          fecha_inicio: "2026-09-01",
          fecha_fin: "2026-09-25",
        },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(queriedWhere.id_usuario, 5);
    assert.deepEqual(queriedWhere.id_sucursal.in, [3]);
  });

  await t.test("branch manager without Empleado_Sucursal assignment cannot access self attendance", async () => {
    let branchManagerLookup = false;
    prisma.empleado_Sucursal.findMany = async () => [];
    prisma.sucursal.findMany = async () => {
      branchManagerLookup = true;
      return [{ id_sucursal: 3 }];
    };
    let attendanceQueryCalled = false;
    prisma.asistencia.findMany = async () => {
      attendanceQueryCalled = true;
      return [];
    };

    const res = createResponse();
    await attendanceController.getMyAttendanceRecords(
      { user: { id_usuario: 12 }, query: {} },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(branchManagerLookup, false);
    assert.equal(attendanceQueryCalled, false);
  });

  await t.test("employee self history queries and returns only the authenticated user", async () => {
    prisma.empleado_Sucursal.findMany = async () => [{ id_sucursal: 3 }];
    let queriedWhere;
    prisma.asistencia.findMany = async ({ where }) => {
      queriedWhere = where;
      return [{
        id_asistencia: 9,
        id_usuario: 12,
        id_sucursal: 3,
        fecha: new Date("2026-09-25T00:00:00.000Z"),
        hora_entrada: "07:25",
        horas_faltadas: 0,
        categoria: "puntual",
      }];
    };

    const res = createResponse();
    await attendanceController.getMyAttendanceRecords(
      { user: { id_usuario: 12 }, query: { id_usuario: "99" } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(queriedWhere.id_usuario, 12);
    assert.deepEqual(res.body.map((record) => record.id_usuario), [12]);
  });

  await t.test("self check-in status requires explicit branch when employee has multiple active branches", async () => {
    prisma.empleado_Sucursal.findMany = async () => [
      {
        id_sucursal: 3,
        sucursal: { id_sucursal: 3, nombre: "Central", location_configured: true, attendance_radius_m: 75, max_gps_accuracy_m: 50 },
      },
      {
        id_sucursal: 4,
        sucursal: { id_sucursal: 4, nombre: "Norte", location_configured: true, attendance_radius_m: 75, max_gps_accuracy_m: 50 },
      },
    ];

    const res = createResponse();
    await attendanceController.getMyCheckinStatus(
      { user: { id_usuario: 12 }, query: {} },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.eligible, false);
    assert.equal(res.body.code, "MULTIPLE_BRANCHES_SELECT_REQUIRED");
    assert.deepEqual(res.body.branches.map((branch) => branch.id), [3, 4]);
  });

  await t.test("self check-in status uses selected branch only if assigned", async () => {
    prisma.empleado_Sucursal.findMany = async () => [
      {
        id_sucursal: 3,
        sucursal: { id_sucursal: 3, nombre: "Central", location_configured: true, attendance_radius_m: 75, max_gps_accuracy_m: 50 },
      },
      {
        id_sucursal: 4,
        sucursal: { id_sucursal: 4, nombre: "Norte", location_configured: true, attendance_radius_m: 90, max_gps_accuracy_m: 60 },
      },
    ];
    prisma.biometria_Facial.findUnique = async () => ({ activo: true, model_version: "opencv-sface-2021dec" });
    prisma.solicitud_Biometria.findFirst = async () => null;
    prisma.asistencia.findUnique = async () => null;

    const res = createResponse();
    await attendanceController.getMyCheckinStatus(
      { user: { id_usuario: 12 }, query: { id_sucursal: "4" } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.eligible, true);
    assert.equal(res.body.branch.id, 4);
    assert.equal(res.body.branch.radiusMeters, 90);
  });

  await t.test("report-only privilege cannot update attendance", async () => {
    let attendanceRead = false;
    prisma.asistencia.findUnique = async () => {
      attendanceRead = true;
      return null;
    };

    const res = createResponse();
    await attendanceController.updateAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_REPORTES"],
        params: { idAsistencia: "1" },
        body: { hora_entrada: "07:31" },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(attendanceRead, false);
    assert.equal(PRIVILEGIOS.ASI_EDITAR, "ASI_EDITAR");
  });

  await t.test("ASI_EDITAR can update an attendance record in an assigned branch", async () => {
    allowOneBranch(3);
    prisma.asistencia.findUnique = async () => ({
      id_asistencia: 1,
      id_sucursal: 3,
    });
    let updatedData;
    prisma.asistencia.update = async ({ data }) => {
      updatedData = data;
      return {
        id_asistencia: 1,
        id_usuario: 7,
        id_sucursal: 3,
        fecha: new Date("2026-09-01T00:00:00.000Z"),
        hora_entrada: data.hora_entrada,
        horas_faltadas: data.horas_faltadas,
        categoria: data.categoria,
        usuario: {
          id_usuario: 7,
          usuario: "empleado",
          primer_nombre: "Ana",
          primer_apellido: "Paz",
        },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };

    const res = createResponse();
    await attendanceController.updateAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_EDITAR"],
        params: { idAsistencia: "1" },
        body: { hora_entrada: "07:40" },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(updatedData.horas_faltadas, 2);
    assert.equal(updatedData.categoria, "penalizacion_2h");
  });

  await t.test("ASI_EDITAR cannot update a record in another branch", async () => {
    allowOneBranch(3);
    prisma.asistencia.findUnique = async () => ({
      id_asistencia: 1,
      id_sucursal: 4,
    });
    let updateCalled = false;
    prisma.asistencia.update = async () => {
      updateCalled = true;
      return null;
    };

    const res = createResponse();
    await attendanceController.updateAttendance(
      {
        user: { id_usuario: 12 },
        userPrivileges: ["ASI_EDITAR"],
        params: { idAsistencia: "1" },
        body: { hora_entrada: "07:31" },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(updateCalled, false);
  });

  await t.test("self biometric enrollment disabled blocks employee-created requests", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousSelfEnrollment = process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED = "false";

    const res = createResponse();
    await attendanceController.requestBiometricRegistration(
      { user: { id_usuario: 12 }, body: { image_base64: "data:image/jpeg;base64,abc" } },
      res,
    );

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "SELF_BIOMETRIC_ENROLLMENT_DISABLED");

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousSelfEnrollment === undefined) delete process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED;
    else process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED = previousSelfEnrollment;
  });

  await t.test("biometric request response does not expose FaceService embedding", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousSelfEnrollment = process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED;
    const previousKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED = "true";
    process.env.BIOMETRIC_ENCRYPTION_KEY = "test-only-key";

    const faceServicePath = require.resolve("../Services/faceService");
    const faceServiceModule = new Module(faceServicePath);
    faceServiceModule.filename = faceServicePath;
    faceServiceModule.loaded = true;
    faceServiceModule.exports = {
      createEmbedding: async () => ({
        embedding: [0.1, 0.2, 0.3],
        model_version: "opencv-sface-2021dec",
        face_count: 1,
        quality_ok: true,
      }),
    };
    require.cache[faceServicePath] = faceServiceModule;

    let storedRequest;
    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: { id_sucursal: 3, activo: true },
    }];
    prisma.biometria_Facial.findUnique = async () => null;
    prisma.solicitud_Biometria.findFirst = async () => null;
    prisma.solicitud_Biometria.create = async ({ data }) => {
      storedRequest = data;
      return { id_solicitud: 15, status: data.status };
    };

    const res = createResponse();
    await attendanceController.requestBiometricRegistration(
      { user: { id_usuario: 12 }, body: { image_base64: "data:image/jpeg;base64,abc" } },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { id_solicitud: 15, status: "PENDING" });
    assert.equal("embedding" in res.body, false);
    assert.equal(storedRequest.model_version, "opencv-sface-2021dec");
    assert.equal(typeof storedRequest.embedding_encrypted, "string");
    assert.notEqual(storedRequest.embedding_encrypted, JSON.stringify([0.1, 0.2, 0.3]));

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousSelfEnrollment === undefined) delete process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED;
    else process.env.SELF_BIOMETRIC_ENROLLMENT_ENABLED = previousSelfEnrollment;
    if (previousKey === undefined) delete process.env.BIOMETRIC_ENCRYPTION_KEY;
    else process.env.BIOMETRIC_ENCRYPTION_KEY = previousKey;
  });

  await t.test("biometric request approval clears request embedding", async () => {
    let biometricUpsertData;
    let requestUpdateData;
    prisma.solicitud_Biometria.findUnique = async () => ({
      id_solicitud: 10,
      id_usuario: 12,
      status: "PENDING",
      embedding_encrypted: "encrypted-vector",
      model_version: "opencv-sface-2021dec",
    });
    prisma.biometria_Facial.upsert = async ({ create, update }) => {
      biometricUpsertData = { create, update };
      return {};
    };
    prisma.solicitud_Biometria.update = async ({ data }) => {
      requestUpdateData = data;
      return { id_solicitud: 10, status: data.status };
    };

    const res = createResponse();
    await attendanceController.reviewBiometricRequest(
      { user: { id_usuario: 99 }, userPrivileges: ["ASI_BIOMETRIA_ADMINISTRAR"], params: { idSolicitud: "10", decision: "approve" } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(biometricUpsertData.create.embedding, "encrypted-vector");
    assert.equal(requestUpdateData.status, "APPROVED");
    assert.equal(requestUpdateData.embedding_encrypted, null);
  });

  await t.test("old biometric request model cannot be approved", async () => {
    let biometricUpsertCalled = false;
    let requestUpdateCalled = false;
    prisma.solicitud_Biometria.findUnique = async () => ({
      id_solicitud: 12,
      id_usuario: 12,
      status: "PENDING",
      embedding_encrypted: "legacy-encrypted-vector",
      model_version: "buffalo_l",
    });
    prisma.biometria_Facial.upsert = async () => {
      biometricUpsertCalled = true;
      return {};
    };
    prisma.solicitud_Biometria.update = async () => {
      requestUpdateCalled = true;
      return {};
    };

    const res = createResponse();
    await attendanceController.reviewBiometricRequest(
      { user: { id_usuario: 99 }, userPrivileges: ["ASI_BIOMETRIA_ADMINISTRAR"], params: { idSolicitud: "12", decision: "approve" } },
      res,
    );

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, "BIOMETRIC_REENROLLMENT_REQUIRED");
    assert.equal(biometricUpsertCalled, false);
    assert.equal(requestUpdateCalled, false);
  });

  await t.test("biometric request rejection clears request embedding", async () => {
    let biometricUpsertCalled = false;
    let requestUpdateData;
    prisma.solicitud_Biometria.findUnique = async () => ({
      id_solicitud: 11,
      id_usuario: 12,
      status: "PENDING",
      embedding_encrypted: "encrypted-vector",
      model_version: "buffalo_l",
    });
    prisma.biometria_Facial.upsert = async () => {
      biometricUpsertCalled = true;
      return {};
    };
    prisma.solicitud_Biometria.update = async ({ data }) => {
      requestUpdateData = data;
      return { id_solicitud: 11, status: data.status };
    };

    const res = createResponse();
    await attendanceController.reviewBiometricRequest(
      { user: { id_usuario: 99 }, userPrivileges: ["ASI_BIOMETRIA_ADMINISTRAR"], params: { idSolicitud: "11", decision: "reject" } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(biometricUpsertCalled, false);
    assert.equal(requestUpdateData.status, "REJECTED");
    assert.equal(requestUpdateData.embedding_encrypted, null);
  });

  await t.test("successful face check-in updates last_verified_at after attendance is saved", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.BIOMETRIC_ENCRYPTION_KEY = "test-only-key";

    const redisPath = require.resolve("../middleware/redisConfig");
    const redisModule = new Module(redisPath);
    redisModule.filename = redisPath;
    redisModule.loaded = true;
    redisModule.exports = {
      get: async () => "0",
      getdel: async () => JSON.stringify({
        userId: 12,
        branchId: 3,
        latitude: 14.1,
        longitude: -87.2,
        accuracy: 10,
        distanceMeters: 5,
        actions: ["LOOK_CENTER", "BLINK"],
        used: false,
      }),
      incr: async () => 1,
      expire: async () => 1,
      del: async () => 1,
    };
    require.cache[redisPath] = redisModule;

    const faceServicePath = require.resolve("../Services/faceService");
    const faceServiceModule = new Module(faceServicePath);
    faceServiceModule.filename = faceServicePath;
    faceServiceModule.loaded = true;
    faceServiceModule.exports = {
      CURRENT_FACE_MODEL_VERSION: "opencv-sface-2021dec",
      verifyLiveness: async () => ({ verified: true }),
      verifyFace: async () => ({ matched: true, similarity: 0.91 }),
    };
    require.cache[faceServicePath] = faceServiceModule;

    const { encryptEmbedding } = require("../Services/biometricCrypto");
    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: {
        id_sucursal: 3,
        nombre: "Central",
        activo: true,
        location_configured: true,
        lat: 14.1,
        lng: -87.2,
        attendance_radius_m: 75,
        max_gps_accuracy_m: 50,
      },
    }];
    prisma.biometria_Facial.findUnique = async () => ({
      id_usuario: 12,
      activo: true,
      model_version: "opencv-sface-2021dec",
      embedding: encryptEmbedding([0.1, 0.2]),
    });
    prisma.asistencia.findUnique = async () => null;
    let attendanceCreated = false;
    let lastVerifiedAt;
    prisma.asistencia.create = async ({ data }) => {
      attendanceCreated = true;
      return {
        id_asistencia: 20,
        ...data,
        usuario: { id_usuario: 12, usuario: "empleado", primer_nombre: "Ana", primer_apellido: "Paz" },
        sucursal: { id_sucursal: 3, nombre: "Central" },
      };
    };
    prisma.biometria_Facial.update = async ({ data }) => {
      lastVerifiedAt = data.last_verified_at;
      return {};
    };

    const res = createResponse();
    await attendanceController.faceCheckIn(
      {
        user: { id_usuario: 12 },
        body: {
          challenge_id: "challenge-1",
          image_base64: "data:image/jpeg;base64,abc",
          frames: ["frame-1", "frame-2"],
          location: { latitude: 14.1, longitude: -87.2, accuracy: 10 },
        },
      },
      res,
    );

    assert.equal(res.statusCode, 201);
    assert.equal(attendanceCreated, true);
    assert.ok(lastVerifiedAt instanceof Date);

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousKey === undefined) delete process.env.BIOMETRIC_ENCRYPTION_KEY;
    else process.env.BIOMETRIC_ENCRYPTION_KEY = previousKey;
  });

  await t.test("old face model embeddings require reenrollment before matching", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.BIOMETRIC_ENCRYPTION_KEY = "test-only-key";

    const redisPath = require.resolve("../middleware/redisConfig");
    const redisModule = new Module(redisPath);
    redisModule.filename = redisPath;
    redisModule.loaded = true;
    redisModule.exports = {
      get: async () => "0",
      getdel: async () => JSON.stringify({
        userId: 12,
        branchId: 3,
        latitude: 14.1,
        longitude: -87.2,
        accuracy: 10,
        distanceMeters: 5,
        actions: ["LOOK_CENTER", "BLINK"],
        used: false,
      }),
    };
    require.cache[redisPath] = redisModule;

    let verifyFaceCalled = false;
    const faceServicePath = require.resolve("../Services/faceService");
    const faceServiceModule = new Module(faceServicePath);
    faceServiceModule.filename = faceServicePath;
    faceServiceModule.loaded = true;
    faceServiceModule.exports = {
      CURRENT_FACE_MODEL_VERSION: "opencv-sface-2021dec",
      verifyLiveness: async () => ({ verified: true }),
      verifyFace: async () => {
        verifyFaceCalled = true;
        return { matched: true, similarity: 0.99 };
      },
    };
    require.cache[faceServicePath] = faceServiceModule;

    const { encryptEmbedding } = require("../Services/biometricCrypto");
    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: {
        id_sucursal: 3,
        nombre: "Central",
        activo: true,
        location_configured: true,
        lat: 14.1,
        lng: -87.2,
        attendance_radius_m: 75,
        max_gps_accuracy_m: 50,
      },
    }];
    prisma.biometria_Facial.findUnique = async () => ({
      id_usuario: 12,
      activo: true,
      model_version: "insightface-buffalo_l-cpu",
      embedding: encryptEmbedding([0.1, 0.2]),
    });

    const res = createResponse();
    await attendanceController.faceCheckIn(
      {
        user: { id_usuario: 12 },
        body: {
          challenge_id: "challenge-legacy",
          image_base64: "data:image/jpeg;base64,abc",
          frames: ["frame-1", "frame-2"],
          location: { latitude: 14.1, longitude: -87.2, accuracy: 10 },
        },
      },
      res,
    );

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, "BIOMETRIC_REENROLLMENT_REQUIRED");
    assert.equal(verifyFaceCalled, false);

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousKey === undefined) delete process.env.BIOMETRIC_ENCRYPTION_KEY;
    else process.env.BIOMETRIC_ENCRYPTION_KEY = previousKey;
  });

  await t.test("self check-in challenge requests passive motion liveness", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    process.env.BIOMETRIC_ENABLED = "true";

    let storedChallenge;
    const redisPath = require.resolve("../middleware/redisConfig");
    const redisModule = new Module(redisPath);
    redisModule.filename = redisPath;
    redisModule.loaded = true;
    redisModule.exports = {
      set: async (_key, value) => {
        storedChallenge = JSON.parse(value);
        return "OK";
      },
    };
    require.cache[redisPath] = redisModule;

    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: {
        id_sucursal: 3,
        nombre: "Central",
        activo: true,
        location_configured: true,
        lat: 14.1,
        lng: -87.2,
        attendance_radius_m: 75,
        max_gps_accuracy_m: 50,
      },
    }];
    prisma.biometria_Facial.findUnique = async () => ({ id_usuario: 12, activo: true });

    const res = createResponse();
    await attendanceController.createLivenessChallenge(
      { user: { id_usuario: 12 }, body: { latitude: 14.1, longitude: -87.2, accuracy: 10 } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.actions, ["PASSIVE_MOTION"]);
    assert.equal(res.body.liveness_mode, "PASSIVE_MOTION");
    assert.deepEqual(storedChallenge.actions, ["PASSIVE_MOTION"]);

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
  });

  await t.test("invalid GPS consumes challenge and does not call liveness or face match", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.BIOMETRIC_ENCRYPTION_KEY = "test-only-key";

    let getdelCalls = 0;
    const redisPath = require.resolve("../middleware/redisConfig");
    const redisModule = new Module(redisPath);
    redisModule.filename = redisPath;
    redisModule.loaded = true;
    redisModule.exports = {
      get: async () => "0",
      getdel: async () => {
        getdelCalls += 1;
        return JSON.stringify({
          userId: 12,
          branchId: 3,
          latitude: 14.1,
          longitude: -87.2,
          accuracy: 10,
          distanceMeters: 5,
          actions: ["PASSIVE_MOTION"],
          used: false,
        });
      },
    };
    require.cache[redisPath] = redisModule;

    let faceServiceCalled = false;
    const faceServicePath = require.resolve("../Services/faceService");
    const faceServiceModule = new Module(faceServicePath);
    faceServiceModule.filename = faceServicePath;
    faceServiceModule.loaded = true;
    faceServiceModule.exports = {
      CURRENT_FACE_MODEL_VERSION: "opencv-sface-2021dec",
      verifyLiveness: async () => {
        faceServiceCalled = true;
        return { verified: true };
      },
      verifyFace: async () => {
        faceServiceCalled = true;
        return { matched: true, similarity: 0.99 };
      },
    };
    require.cache[faceServicePath] = faceServiceModule;

    const { encryptEmbedding } = require("../Services/biometricCrypto");
    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: {
        id_sucursal: 3,
        nombre: "Central",
        activo: true,
        location_configured: true,
        lat: 14.1,
        lng: -87.2,
        attendance_radius_m: 75,
        max_gps_accuracy_m: 50,
      },
    }];
    prisma.biometria_Facial.findUnique = async () => ({
      id_usuario: 12,
      activo: true,
      model_version: "opencv-sface-2021dec",
      embedding: encryptEmbedding([0.1, 0.2]),
    });

    const res = createResponse();
    await attendanceController.faceCheckIn(
      {
        user: { id_usuario: 12 },
        body: {
          challenge_id: "challenge-gps",
          image_base64: "data:image/jpeg;base64,abc",
          frames: ["frame-1", "frame-2", "frame-3"],
          location: { latitude: 14.1, longitude: -87.2, accuracy: 500 },
        },
      },
      res,
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, "GPS_INACCURATE");
    assert.equal(getdelCalls, 1);
    assert.equal(faceServiceCalled, false);

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousKey === undefined) delete process.env.BIOMETRIC_ENCRYPTION_KEY;
    else process.env.BIOMETRIC_ENCRYPTION_KEY = previousKey;
  });

  await t.test("wrong face after passive liveness does not register attendance", async () => {
    const previousBiometric = process.env.BIOMETRIC_ENABLED;
    const previousKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
    process.env.BIOMETRIC_ENABLED = "true";
    process.env.BIOMETRIC_ENCRYPTION_KEY = "test-only-key";

    const redisPath = require.resolve("../middleware/redisConfig");
    const redisModule = new Module(redisPath);
    redisModule.filename = redisPath;
    redisModule.loaded = true;
    redisModule.exports = {
      get: async () => "0",
      getdel: async () => JSON.stringify({
        userId: 12,
        branchId: 3,
        latitude: 14.1,
        longitude: -87.2,
        accuracy: 10,
        distanceMeters: 5,
        actions: ["PASSIVE_MOTION"],
        used: false,
      }),
      incr: async () => 1,
      expire: async () => 1,
    };
    require.cache[redisPath] = redisModule;

    let livenessActions;
    const faceServicePath = require.resolve("../Services/faceService");
    const faceServiceModule = new Module(faceServicePath);
    faceServiceModule.filename = faceServicePath;
    faceServiceModule.loaded = true;
    faceServiceModule.exports = {
      CURRENT_FACE_MODEL_VERSION: "opencv-sface-2021dec",
      verifyLiveness: async (_frames, actions) => {
        livenessActions = actions;
        return { verified: true, reason: "PASSIVE_FACE_MOTION" };
      },
      verifyFace: async () => ({ matched: false, similarity: 0.12 }),
    };
    require.cache[faceServicePath] = faceServiceModule;

    const { encryptEmbedding } = require("../Services/biometricCrypto");
    prisma.empleado_Sucursal.findMany = async () => [{
      id_sucursal: 3,
      sucursal: {
        id_sucursal: 3,
        nombre: "Central",
        activo: true,
        location_configured: true,
        lat: 14.1,
        lng: -87.2,
        attendance_radius_m: 75,
        max_gps_accuracy_m: 50,
      },
    }];
    prisma.biometria_Facial.findUnique = async () => ({
      id_usuario: 12,
      activo: true,
      model_version: "opencv-sface-2021dec",
      embedding: encryptEmbedding([0.1, 0.2]),
    });
    let attendanceCreated = false;
    prisma.asistencia.create = async () => {
      attendanceCreated = true;
      return {};
    };

    const res = createResponse();
    await attendanceController.faceCheckIn(
      {
        user: { id_usuario: 12 },
        body: {
          challenge_id: "challenge-face",
          image_base64: "data:image/jpeg;base64,abc",
          frames: ["frame-1", "frame-2", "frame-3"],
          location: { latitude: 14.1, longitude: -87.2, accuracy: 10 },
        },
      },
      res,
    );

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.code, "FACE_NOT_MATCHED");
    assert.deepEqual(livenessActions, ["PASSIVE_MOTION"]);
    assert.equal(attendanceCreated, false);

    if (previousBiometric === undefined) delete process.env.BIOMETRIC_ENABLED;
    else process.env.BIOMETRIC_ENABLED = previousBiometric;
    if (previousKey === undefined) delete process.env.BIOMETRIC_ENCRYPTION_KEY;
    else process.env.BIOMETRIC_ENCRYPTION_KEY = previousKey;
  });
});
