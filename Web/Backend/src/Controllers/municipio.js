const { municipio, departamento } = require("../config/database");

async function createMunicipio(req, res){
    try{
        const {
            nombre,
            id_departamento
        } = req.body;
        if (!nombre || !id_departamento){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            });
        }
        const check = await municipio.findFirst({
            where: {
                nombre: nombre,
                id_departamento: parseInt(id_departamento)
            }
        });
        if(check){
            return res.status(409).json({
                status: "Conflicto en nombre",
                error: "Municipio ya existe"
            })
        }
        const newMuni = await municipio.create({
            data:{
                nombre,
                id_departamento: parseInt(id_departamento)
            }
        });
        return res.status(201).json({
            status: "Finalizado",
            message: "Municipio creado con éxito",
            data: newMuni
        });
    } catch (error){
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

async function getMunicipioByName(req, res){
    try{
        const { nombre } = req.params;
        const found = await municipio.findFirst({
            where:{ nombre: nombre }
        })
        if(!found){
            return res.status(404).json({ error: "Municipio no encontrado" });
        }
        return res.status(200).json({
            status: "Exitoso",
            data: found
        })
    }catch (error){
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

async function getAllMunicipios(req, res){
    try {
        const municipios = await municipio.findMany({
            include: {
                departamento: {
                    select: { nombre_departamento: true }
                }
            }
        });
        res.status(200).json(municipios);
    } catch (error) {
        res.status(500).json({ error: "Error del servidor" });
    }
}

async function getAllMunicipiosPyDeptID(req, res){
    try{
        const { id_dept } = req.params;
        const deptId = parseInt(id_dept);
        if (isNaN(deptId)) {
            return res.status(400).json({
                error: "ID de departamento inválido"
            });
        }
        const municipios = await municipio.findMany({
            where: {id_departamento: deptId},
        })
        res.status(200).json(municipios)
    } catch (error) {
        res.status(500).json({ error: "Error del servidor" });
    }
}

async function getMunicipioByID(req, res){
    try{
        const { id } = req.params;
        const found = await municipio.findUnique({
            where:{ id_municipio: parseInt(id) }
        })
        if(!found){
            return res.status(404).json({ error: "Municipio no encontrado" });
        }
        return res.status(200).json({
            status: "Exitoso",
            data: found
        })
    }catch (error){
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

//Departamento
async function createDepartamento(req, res){
    try{
        const {
            nombre_departamento
        } = req.body;
        if (!nombre_departamento){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            });
        }
        const check = await departamento.findFirst({
            where: {nombre_departamento}
        });
        if(check){
            return res.status(409).json({
                status: "Conflicto en nombre",
                error: "Departamento ya existe"
            })
        }
        const newDep = await departamento.create({
            data:{
                nombre_departamento: nombre_departamento
            }
        });
        return res.status(201).json({
            status: "Finalizado",
            message: "Departamento creado con éxito",
            data: newDep
        });
    } catch (error){
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}

async function getAllDepartamentos(req, res){
    try {
        const departamentos = await departamento.findMany();
        res.status(200).json({
            status: "Exitoso",
            message: "Se obtuvieron los siguientes departamentos",
            data: departamentos}
        );
    } catch(error) {
        res.status(500).json({ error: "Error del servidor" });
    }
}

async function getDepartamentoByName(req, res){
    try{
        const { nombre } = req.params;
        const found = await departamento.findFirst({
            where:{ nombre_departamento: nombre }
        })
        if(!found){
            return res.status(404).json({ error: "Departamento no encontrado" });
        }
        return res.status(200).json({
            status: "Exitoso",
            data: found
        })
    }catch (error){
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

async function getDepartamentoByID(req, res){
    try{
        const { id } = req.params;
        const found = await departamento.findUnique({
            where:{ id_departamento: parseInt(id) }
        })
        if(!found){
            return res.status(404).json({ error: "Departamento no encontrado" });
        }
        return res.status(200).json({
            status: "Exitoso",
            data: found
        })
    }catch (error){
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

module.exports = {
    createMunicipio,
    getMunicipioByName,
    getAllMunicipios,
    getAllMunicipiosPyDeptID,
    getMunicipioByID,
    createDepartamento,
    getAllDepartamentos,
    getDepartamentoByName,
    getDepartamentoByID

}
