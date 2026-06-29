const { sucursal, municipio, departamento, empleado_Sucursal } = require("../config/database");


async function getAllSucursales(req, res) {
    try {
        const sucursales = await sucursal.findMany({
            include: {
                municipio: {
                    select: {
                        nombre: true,
                        departamento: {
                            select: { nombre_departamento: true }
                        }
                    }
                },
                usuario: {
                    select: {
                        id_usuario: true,
                        primer_nombre: true,
                        primer_apellido: true
                    }
                }
            }
        });
        res.status(200).json(sucursales);
    } catch (error) {
        res.status(500).json({ error: "Error fetching sucursal" });
    }
}

async function getAllActiveSucursales(req, res) {
    try {
        const sucursales = await sucursal.findMany({
            include: {
                municipio: {
                    select: {
                        nombre: true,
                        departamento: {
                            select: { nombre_departamento: true }
                        }
                    }
                },
                usuario: {
                    select: {
                        id_usuario: true,
                        primer_nombre: true,
                        primer_apellido: true
                    }
                }
            },
            where: {
                activo: true
            }
        });
        res.status(200).json(sucursales);
    } catch (error) {
        res.status(500).json({ error: "Error fetching sucursal" });
    }
}

async function getSucursalByID(req, res) {
    try {
        const { id } = req.params;
        const found = await sucursal.findUnique({
            where: { id_sucursal: parseInt(id) },
            include: {
                municipio: {
                    select: {
                        nombre: true,
                        departamento: {
                            select: { nombre_departamento: true }
                        }
                    }
                },
                usuario: true
            }
        });

        if (!found) {
            return res.status(404).json({ error: "Sucursal no encontrada" });
        }

        res.status(200).json(found);
    } catch (error) {
        res.status(500).json({ error: "Error fetching sucursal" });
    }
}

async function createSucursal(req, res) {
    try{
        const {
            nombre,
            gerente,
            RTN,
            id_municipio,
            direccion,
            lat,
            lng
        } = req.body;

        if(!nombre || !gerente || !RTN || id_municipio == null || !lat || !lng){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            })
        }
        const check = await sucursal.findFirst({
            where: {nombre: nombre}
        })
        if(check){
            return res.status(409).json({
                status: "Conflicto en nombre",
                error: "Nombre ya existente"
            })
        }
        const newSucursal = await sucursal.create({
            data: {
                nombre,
                RTN,
                activo: true,
                id_municipio: parseInt(id_municipio),
                id_usuario: parseInt(gerente),
                direccion,
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            }
        })
        return res.status(201).json({
            status: "Finalizado",
            message: "Sucursal creada con éxito",
            data: newSucursal
        })
    } catch (error) {
        res.status(500).json({ error: "Error creando" });
    }
}

async function editSucursal(req, res){
    try{
        const {
            nombre,
            RTN,
            id_municipio,
            id_usuario,
            direccion,
            lat,
            lng
        } = req.body;

        const { id } = req.params;

        const check = await sucursal.findUnique({
            where: { id_sucursal: parseInt(id) }
        });

        if (!check) {
            return res.status(404).json({ error: "Sucursal no encontrada" });
        }

        const updated = await sucursal.update({
            where: { id_sucursal: parseInt(id) },
            data: {
                ...(nombre !== undefined && { nombre }),
            ...(RTN !== undefined && { RTN }),
            ...(id_municipio !== undefined && { id_municipio: parseInt(id_municipio) }),
            ...(id_usuario !== undefined && { id_usuario: parseInt(id_usuario) }),
            ...(direccion !== undefined && { direccion }),
            ...(lat !== undefined && { lat: parseFloat(lat) }),
            ...(lng !== undefined && { lng: parseFloat(lng) })
            },
        });

        return res.status(200).json({
            message: "Sucursal actualizada correctamente",
            data: updated
        });

    } catch (error) {
        res.status(500).json({ error: "Error actualizando" });
    }
}

async function toggleActiveSucursal(req, res){
    try{
        const { activo } = req.body;
        const { id } = req.params;

        if(activo === undefined){
            return res.status(400).json({
                error: "Cuerpo recibido vacío"
            })
        }
        if (typeof activo !== "boolean") {
            return res.status(400).json({
                error: "El campo activo debe ser boolean"
            });
        }
        const updated = await sucursal.update({
            where: { id_sucursal: parseInt(id) },
            data: {
                activo: activo
            }
        });

        return res.status(200).json({
            message: "Sucursal actualizada correctamente",
            data: updated
        });
    }catch (error){
        res.status(500).json({ error: "Error actualizando" });
    }
}

//Rutas para Empleado_sucursal
async function getAllEmpleadosForSucursal(req, res) {
    try {
        const { id } = req.params;
        const found = await empleado_Sucursal.findMany({
            where: { id_sucursal: parseInt(id) },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        primer_nombre: true,
                        primer_apellido: true
                    }
                }
            }
        });

        if (!found) {
            return res.status(404).json({ error: "Sucursal no encontrada" });
        }

        res.status(200).json(found);
    } catch (error) {
        res.status(500).json({ error: "Error fetching sucursal" });
    }
}

async function createAsignacion(req, res) {
    try {
        const { id } = req.params;
        const {
            id_usuario
        } = req.body

        if(id_usuario == null){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            })
        }
        const newAsignacion = await empleado_Sucursal.create({
            data: {
                id_usuario,
                id_sucursal: parseInt(id)
            }
        });

        return res.status(201).json({
            status: "Finalizado",
            message: "Asignacion creada con éxito",
            data: newAsignacion
        })
    } catch (error) {
        res.status(500).json({ error: "Error creando asignación" });
    }
}


module.exports = {
    getAllSucursales,
    getSucursalByID,
    createSucursal,
    editSucursal,
    toggleActiveSucursal,
    getAllEmpleadosForSucursal,
    createAsignacion,
    getAllActiveSucursales

};
