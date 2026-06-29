const prisma = require("../config/database");

class CategoriasService {
  async obtenerCategorias() {
    const categorias = await prisma.categoria.findMany({
      where: {
        activo: true,
      },
      select: {
        id_categoria: true,
        nombre: true,
        imagen_url: true,
        activo: true,
      },
      orderBy: { nombre: "asc" },
    });
    return categorias;
  }

  async obtenerCategoriasFiltro() {
    const categorias = await prisma.categoria.findMany({
      where: {
        activo: true,
        producto: {
          some: {
            estado: true
          }
        }
      },
      select: {
        id_categoria: true,
        nombre: true,
        imagen_url: true,
        activo: true,
      },
      orderBy: { nombre: "asc" },
    });
    return categorias;
  }

  async crearCategoria(datos, filename) {
    const { nombre, activo } = datos;

    if (!nombre || nombre.trim() === "") {
      throw { status: 400, message: "El nombre de la categoría es obligatorio" };
    }

    if (!filename) {
      throw { status: 400, message: "La imagen de la categoría es obligatoria" };
    }

    if (nombre.trim().length > 50) {
      throw { status: 400, message: "El nombre no puede tener más de 50 caracteres" };
    }

    const categoriaExistente = await prisma.categoria.findFirst({
      where: { nombre: nombre.trim() },
    });

    if (categoriaExistente) {
      throw { status: 409, message: "Ya existe una categoría con ese nombre" };
    }

    const imagen_url = filename;

    const nuevaCategoria = await prisma.categoria.create({
      data: {
        nombre: nombre.trim(),
        imagen_url,
        activo:
          activo === true ||
          activo === "true" ||
          activo === 1 ||
          activo === "1",
      },
    });

    return nuevaCategoria;
  }

  async modificarCategoria(id, datos, filename) {
    const { nombre, activo } = datos;
    const idCategoria = Number(id);

    if (!id || isNaN(idCategoria)) {
      throw { status: 400, message: "El id de la categoría es inválido" };
    }

    if (!nombre || nombre.trim() === "") {
      throw { status: 400, message: "El nombre de la categoría es obligatorio" };
    }

    if (nombre.trim().length > 50) {
      throw { status: 400, message: "El nombre no puede tener más de 50 caracteres" };
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id_categoria: idCategoria },
    });

    if (!categoriaExistente) {
      throw { status: 404, message: "La categoría no existe" };
    }

    const categoriaConMismoNombre = await prisma.categoria.findFirst({
      where: {
        nombre: nombre.trim(),
        NOT: {
          id_categoria: idCategoria,
        },
      },
    });

    if (categoriaConMismoNombre) {
      throw { status: 409, message: "Ya existe otra categoría con ese nombre" };
    }

    const dataToUpdate = {
      nombre: nombre.trim(),
      activo:
        activo === true || activo === "true" || activo === 1 || activo === "1",
    };

    if (filename) {
      dataToUpdate.imagen_url = filename;
    }

    const categoriaActualizada = await prisma.categoria.update({
      where: { id_categoria: idCategoria },
      data: dataToUpdate,
    });

    return categoriaActualizada;
  }

  async eliminarCategoria(id) {
    const idCategoria = Number(id);

    if (!id || isNaN(idCategoria)) {
      throw { status: 400, message: "El id de la categoría es inválido" };
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: {
        id_categoria: idCategoria,
      },
    });

    if (!categoriaExistente) {
      throw { status: 404, message: "La categoría no existe" };
    }

    if (categoriaExistente.activo === false) {
      throw { status: 400, message: "La categoría ya está inactiva" };
    }

    const categoriaActualizada = await prisma.categoria.update({
      where: {
        id_categoria: idCategoria,
      },
      data: {
        activo: false,
      },
    });

    return categoriaActualizada;
  }
}

module.exports = new CategoriasService();
