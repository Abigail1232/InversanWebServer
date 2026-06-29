const { bodega } = require("../config/database")

async function getAllBodegas(req, res) {
    try {
        const bodegas = await bodega.findMany({
            include: {
                sucursal: {
                    select: {
                        nombre: true,
                        activo: true
                    }
                },
            }
        });
        res.status(200).json({
            data:bodegas
        });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

async function getBodegaByID(req, res) {
    try {
        const { id } = req.params;
        const found = await bodega.findUnique({
            where: { id_bodega: parseInt(id) },
            include: {
                sucursal: {
                    select: {
                        nombre: true,
                        activo: true
                    }
                },
            }
        });

        if(!found) {
            return res.status(404).json({
                error: "Bodega no encontrada"
            })
        }
        return res.status(200).json({
            message: "Bodega encontrada",
            data:found
        });
    } catch (error) {
        return res.status(500).json({error: "Error inesperado en la base de datos"})
    }
}

async function createBodega(req, res) {
    try{
        const {
            nombre,
            id_sucursal
        } = req.body;
        if (!nombre || !id_sucursal){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            });
        }
        const check = await bodega.findFirst({
            where: {nombre}
        });
        if(check){
            return res.status(409).json({
                message: "Conflicto en nombre",
                error: "Bodega ya existe"
            })
        }
        const newBodega = await bodega.create({
            data:{
                nombre,
                activo: true,
                id_sucursal: parseInt(id_sucursal)
            }
        });
        return res.status(201).json({
            message: "Bodega creada con éxito",
            data: newBodega
        })
    }catch(error) {
        return res.status(500).json({ error: "Error creando bodega" });
    }
}

async function editBodega(req, res){
    try{
        const {
            nombre,
            id_sucursal
        } = req.body;

        const { id } = req.params;

        const check = await bodega.findUnique({
            where: { id_bodega: parseInt(id) }
        });

        if (!check) {
            return res.status(404).json({ error: "Bodega no encontrada" });
        }

        const updated = await bodega.update({
            where: { id_bodega: parseInt(id) },
            data: {
                ...(nombre !== undefined && { nombre }),
                ...(id_sucursal !== undefined && { id_sucursal: parseInt(id_sucursal) }),
            },
        });

        return res.status(200).json({
            message: "Sucursal actualizada correctamente",
            data: updated
        });

    } catch (error) {
        res.status(500).json({ message: "Error actualizando", error: error });
    }
}

async function toggleActiveBodega(req, res) {
    try {
        const { activo } = req.body;
        const { id } = req.params;

        if (activo === undefined) {
            return res.status(400).json({
                error: "Cuerpo recibido vacío"
            });
        }

        if (typeof activo !== "boolean") {
            return res.status(400).json({
                error: "El campo activo debe ser boolean"
            });
        }

        const check = await bodega.findUnique({
            where: { id_bodega: parseInt(id) }
        });

        if (!check) {
            return res.status(404).json({ error: "Bodega no encontrada" });
        }

        const updated = await bodega.update({
            where: { id_bodega: parseInt(id) },
            data: { activo }
        });

        return res.status(200).json({
            message: "Bodega actualizada correctamente",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ error: "Error actualizando bodega" });
    }
}

module.exports = {
    getAllBodegas,
    getBodegaByID,
    createBodega,
    editBodega,
    toggleActiveBodega

};
