const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Asignación dinámica de privilegios a cada rol basándose en nombres.
 */
async function insertRolPrivilegio() {
  // 1. Obtener todos los roles y privilegios actuales para tener sus IDs reales
  const roles = await prisma.rol.findMany();
  const privilegios = await prisma.privilegio.findMany();

  // Crear mapas para búsqueda fácil por nombre
  const rid = (nombre) => roles.find((r) => r.nombre === nombre)?.id_rol;
  const pid = (nombre) => privilegios.find((p) => p.nombre === nombre)?.id_privilegio;

  // Definir las asignaciones por nombre de rol y lista de nombres de privilegios
  const asignaciones = [
    {
      rol: "Admin",
      privs: ["ALL_ACCESS"],
    },
    {
      rol: "Vendedor",
      privs: [
        "PED_ENTREGA", // El vendedor puede entregar pedidos
        "PED_HISTORIAL", // El vendedor puede ver el historial
        "DASHBOARD_VIEW", // El vendedor puede ver el dashboard (visto antes)
      ],
    },
    {
      rol: "Gestor",
      privs: [
        "DASHBOARD_VIEW",
        "ADM_SUCURSALES",
        "INV_INGRESO",
        "INV_HISTORIAL",
        "ADM_MODELOS",
        "ADM_PRODUCTOS",
        "ADM_MARCAS",
        "ADM_PROMOCIONES",
        "ADM_CATEGORIAS",
        "ADM_DISENOS",
        "PED_PEDIDOS",
        "PED_ENTREGA",
        "PED_HISTORIAL",
      ],
    },
    {
      rol: "User",
      privs: ["SOLO_CLIENTES"],
    },
    {
      rol: "Mayoreo",
      privs: ["SOLO_CLIENTES", "IS_MAYORIST"],
    },
  ];

  const registros = [];

  for (const group of asignaciones) {
    const id_rol = rid(group.rol);
    if (!id_rol) {
      console.warn(`Rol no encontrado: ${group.rol}`);
      continue;
    }

    for (const pName of group.privs) {
      const id_privilegio = pid(pName);
      if (!id_privilegio) {
        console.warn(`Privilegio no encontrado: ${pName}`);
        continue;
      }
      registros.push({ id_rol, id_privilegio });
    }
  }

  // Insertar registros
  for (const item of registros) {
    try {
      await prisma.rol_Privilegio.create({
        data: item,
      });
    } catch (error) {
      // Ignorar duplicados si se vuelve a correr el seeder
      if (error.code !== "P2002") {
        console.error(
          `Error asignando ${item.id_privilegio} al rol ${item.id_rol}:`,
          error.message
        );
      }
    }
  }

  console.log("Asignaciones Rol_Privilegio completadas.");
}

module.exports = { insertRolPrivilegio };
