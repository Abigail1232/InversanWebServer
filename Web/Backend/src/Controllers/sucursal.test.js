const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

const prisma = {
  sucursal: {
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
  },
  municipio: {},
  departamento: {},
  empleado_Sucursal: {},
};

const databasePath = require.resolve("../config/database");
const databaseModule = new Module(databasePath);
databaseModule.filename = databasePath;
databaseModule.loaded = true;
databaseModule.exports = prisma;
require.cache[databasePath] = databaseModule;

const sucursalController = require("./sucursal");

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

test("branch location settings require explicit valid coordinates and sane limits", async (t) => {
  await t.test("create rejects missing coordinates instead of using a visual fallback", async () => {
    const res = createResponse();
    await sucursalController.createSucursal(
      {
        body: {
          nombre: "Nueva",
          gerente: 1,
          RTN: "05019999123456",
          id_municipio: 79,
          direccion: "Referencia",
          attendance_radius_m: 75,
          max_gps_accuracy_m: 50,
        },
      },
      res,
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, "BRANCH_LOCATION_REQUIRED");
  });

  await t.test("edit without coordinates preserves location_configured", async () => {
    prisma.sucursal.findUnique = async () => ({
      id_sucursal: 1,
      lat: 15.5,
      lng: -88,
      location_configured: false,
    });
    let updateData;
    prisma.sucursal.update = async ({ data }) => {
      updateData = data;
      return { id_sucursal: 1, ...data };
    };

    const res = createResponse();
    await sucursalController.editSucursal(
      { params: { id: "1" }, body: { nombre: "Editada", attendance_radius_m: 75, max_gps_accuracy_m: 50 } },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal("location_configured" in updateData, false);
    assert.equal("lat" in updateData, false);
    assert.equal("lng" in updateData, false);
  });

  await t.test("edit rejects non-positive or non-finite radius and accuracy", async () => {
    prisma.sucursal.findUnique = async () => ({ id_sucursal: 1 });

    const radiusRes = createResponse();
    await sucursalController.editSucursal(
      { params: { id: "1" }, body: { attendance_radius_m: 0 } },
      radiusRes,
    );
    assert.equal(radiusRes.statusCode, 400);
    assert.equal(radiusRes.body.code, "INVALID_BRANCH_LOCATION_LIMIT");
    assert.equal(radiusRes.body.field, "attendance_radius_m");

    const accuracyRes = createResponse();
    await sucursalController.editSucursal(
      { params: { id: "1" }, body: { max_gps_accuracy_m: "Infinity" } },
      accuracyRes,
    );
    assert.equal(accuracyRes.statusCode, 400);
    assert.equal(accuracyRes.body.code, "INVALID_BRANCH_LOCATION_LIMIT");
    assert.equal(accuracyRes.body.field, "max_gps_accuracy_m");
  });
});
