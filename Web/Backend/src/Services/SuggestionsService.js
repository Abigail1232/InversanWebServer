const prisma = require("../config/database");

class SuggestionsService {
  async crearSugerencia(data, user) {
    const { titulo, tipo, descripcion } = data;

    if (!titulo || !descripcion) {
      throw { status: 400, message: "titulo y descripcion son requeridos" };
    }

    // Si está logueado usa user.id, si no -> 1 (guest default)
    const id_usuario = Number(user?.id) || 1;

    return await prisma.sugerencia.create({
      data: {
        id_usuario,
        tipo: tipo || "idea",
        titulo,
        descripcion,
        fecha: new Date(),
      },
    });
  }

  async obtenerSugerencias() {
    return await prisma.sugerencia.findMany({
      include: {
        usuario: {
          select: { usuario: true }
        }
      },
      orderBy: { fecha: "desc" }
    });
  }

  async obtenerSugerenciaPorId(id) {
    if (isNaN(id)) {
      throw { status: 400, message: "ID inválido" };
    }

    const sugerencia = await prisma.sugerencia.findUnique({
      where: { id_sugerencia: parseInt(id) },
      include: {
        usuario: {
          select: { usuario: true }
        }
      }
    });

    if (!sugerencia) {
      throw { status: 404, message: "Sugerencia no encontrada" };
    }

    return sugerencia;
  }
}

module.exports = new SuggestionsService();
