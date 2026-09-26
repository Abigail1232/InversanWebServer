const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

const prisma = {
  empleado_Sucursal: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  sucursal: { findMany: async () => [] },
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
});