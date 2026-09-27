const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

function loadSeeders(prisma) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "@prisma/client") {
      return { PrismaClient: class { constructor() { return prisma; } } };
    }
    if (request === "bcrypt") {
      return { hash: async (password) => `hashed:${password}` };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  const databasePath = require.resolve("../config/database");
  const databaseModule = new Module(databasePath);
  databaseModule.filename = databasePath;
  databaseModule.loaded = true;
  databaseModule.exports = prisma;
  require.cache[databasePath] = databaseModule;

  return {
    Privilegios: require("./privilegios").Privilegios,
    insertRoles: require("./Roles").insertRoles,
    insertUsuarios: require("./usuarios").insertUsuarios,
    insertEmpleadoSucursal: require("./empleado_sucursal").insertEmpleadoSucursal,
    insertRolPrivilegio: require("./rol_privilegio").insertRolPrivilegio,
  };
}

function createSeedDatabase() {
  const state = {
    roles: [{ id_rol: 41, nombre: "Marcar asistencia", descripcion: "Creado por migración", activo: true }],
    users: [],
    branches: [
      { id_sucursal: 21, nombre: "Sucursal San Pedro Sula" },
      { id_sucursal: 46, nombre: "Sucursal Tegucigalpa" },
    ],
    employeeBranches: [],
    rolePrivileges: [],
    privileges: [
      "ALL_ACCESS", "PED_ENTREGA", "PED_HISTORIAL", "DASHBOARD_VIEW",
      "ADM_SUCURSALES", "INV_INGRESO", "INV_HISTORIAL", "ADM_MODELOS",
      "ADM_PRODUCTOS", "ADM_MARCAS", "ADM_PROMOCIONES", "ADM_CATEGORIAS",
      "ADM_DISENOS", "PED_PEDIDOS", "ASI_MARCAR", "ASI_ADMINISTRAR",
      "ASI_REPORTES", "ASI_EDITAR", "SOLO_CLIENTES", "IS_MAYORIST",
    ].map((nombre, index) => ({ id_privilegio: index + 1, nombre })),
  };

  let nextRoleId = 101;
  let nextUserId = 301;

  const prisma = {
    rol: {
      findFirst: async ({ where }) => state.roles
        .filter((role) => role.nombre === where.nombre)
        .sort((left, right) => left.id_rol - right.id_rol)[0] || null,
      findMany: async () => [...state.roles],
      create: async ({ data }) => {
        const role = { id_rol: nextRoleId++, ...data };
        state.roles.push(role);
        return role;
      },
      update: async ({ where, data }) => {
        const role = state.roles.find((item) => item.id_rol === where.id_rol);
        Object.assign(role, data);
        return role;
      },
    },
    usuario: {
      findUnique: async ({ where }) => state.users.find((user) => user.usuario === where.usuario) || null,
      upsert: async ({ where, update, create }) => {
        const existing = state.users.find((user) => user.usuario === where.usuario);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const user = { id_usuario: nextUserId++, ...create };
        state.users.push(user);
        return user;
      },
    },
    sucursal: {
      findFirst: async ({ where }) => state.branches
        .filter((branch) => branch.nombre === where.nombre)
        .sort((left, right) => left.id_sucursal - right.id_sucursal)[0] || null,
    },
    empleado_Sucursal: {
      findUnique: async ({ where }) => state.employeeBranches.find((item) =>
        item.id_usuario === where.id_usuario_id_sucursal.id_usuario &&
        item.id_sucursal === where.id_usuario_id_sucursal.id_sucursal,
      ) || null,
      create: async ({ data }) => {
        const item = { id_empleado_sucursal: state.employeeBranches.length + 1, ...data };
        state.employeeBranches.push(item);
        return item;
      },
    },
    privilegio: {
      findFirst: async ({ where }) => state.privileges.find((privilege) => privilege.nombre === where.nombre) || null,
      findMany: async () => [...state.privileges],
      create: async ({ data }) => {
        const privilege = { id_privilegio: state.privileges.length + 1, ...data };
        state.privileges.push(privilege);
        return privilege;
      },
    },
    rol_Privilegio: {
      create: async ({ data }) => {
        const duplicate = state.rolePrivileges.some((item) =>
          item.id_rol === data.id_rol && item.id_privilegio === data.id_privilegio,
        );
        if (duplicate) {
          const error = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }
        state.rolePrivileges.push(data);
        return data;
      },
    },
  };

  return { prisma, state };
}

test("seeders are repeatable and resolve roles/users/branches by names", async () => {
  const { prisma, state } = createSeedDatabase();
  const seeders = loadSeeders(prisma);

  for (let run = 0; run < 2; run += 1) {
    await seeders.Privilegios();
    await seeders.insertRoles();
    await seeders.insertRolPrivilegio();
    await seeders.insertUsuarios();
    await seeders.insertEmpleadoSucursal();
  }

  const rolesByName = new Map(state.roles.map((role) => [role.nombre, role]));
  assert.equal(state.roles.length, 6);
  assert.equal(rolesByName.get("Admin").id_rol, 101);
  assert.equal(rolesByName.get("Marcar asistencia").id_rol, 41);
  assert.equal(state.users.length, 6);

  const assignedRoles = Object.fromEntries(state.users.map((user) => [
    user.usuario,
    rolesByName.get("Admin").id_rol === user.id_rol
      ? "Admin"
      : state.roles.find((role) => role.id_rol === user.id_rol).nombre,
  ]));
  assert.deepEqual(assignedRoles, {
    admin: "Admin",
    Vendedor1: "Vendedor",
    Gestor1: "Gestor",
    user1: "User",
    user2: "User",
    mayoreo: "Mayoreo",
  });

  const adminAccess = state.rolePrivileges.filter((item) =>
    item.id_rol === rolesByName.get("Admin").id_rol &&
    state.privileges.find((privilege) => privilege.id_privilegio === item.id_privilegio).nombre === "ALL_ACCESS",
  );
  assert.equal(adminAccess.length, 1);
  assert(state.privileges.some((privilege) => privilege.nombre === "ASI_BIOMETRIA_ADMINISTRAR"));

  const markerRoleId = rolesByName.get("Marcar asistencia").id_rol;
  const markerPrivileges = state.rolePrivileges
    .filter((item) => item.id_rol === markerRoleId)
    .map((item) => state.privileges.find((privilege) => privilege.id_privilegio === item.id_privilegio).nombre);
  assert(markerPrivileges.includes("ASI_REPORTES"));
  assert(!markerPrivileges.includes("ASI_EDITAR"));

  assert.equal(state.employeeBranches.length, 5);
  assert.equal(new Set(state.employeeBranches.map((item) => `${item.id_usuario}:${item.id_sucursal}`)).size, 5);

  const admin = state.users.find((user) => user.usuario === "admin");
  admin.clave = "manually-changed-password";
  await seeders.insertUsuarios();
  assert.equal(admin.clave, "manually-changed-password");
});
