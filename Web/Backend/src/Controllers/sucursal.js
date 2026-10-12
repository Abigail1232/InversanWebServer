const { sucursal, municipio, departamento, empleado_Sucursal } = require("../config/database");

const ATTENDANCE_RADIUS_LIMITS = { min: 1, max: 10000 };
const GPS_ACCURACY_LIMITS = { min: 1, max: 5000 };

function hasValidBranchCoordinates(lat, lng) {
    const normalizedLat = Number(lat);
    const normalizedLng = Number(lng);
    return Number.isFinite(normalizedLat)
        && Number.isFinite(normalizedLng)
        && normalizedLat >= -90
        && normalizedLat <= 90
        && normalizedLng >= -180
        && normalizedLng <= 180
        && !(normalizedLat === 0 && normalizedLng === 0);
}

function parsePositiveIntegerInRange(value, field, limits) {
    if (value === undefined || value === null || value === "") return { value: undefined };
    const normalized = Number(value);
    if (!Number.isInteger(normalized) || normalized < limits.min || normalized > limits.max) {
        return {
            error: {
                code: "INVALID_BRANCH_LOCATION_LIMIT",
                field,
                error: `${field} debe ser un entero entre ${limits.min} y ${limits.max}.`,
            },
        };
    }
    return { value: normalized };
}

function validateAttendanceLocationSettings(body) {
    const radius = parsePositiveIntegerInRange(body.attendance_radius_m, "attendance_radius_m", ATTENDANCE_RADIUS_LIMITS);
    if (radius.error) return radius;

    const accuracy = parsePositiveIntegerInRange(body.max_gps_accuracy_m, "max_gps_accuracy_m", GPS_ACCURACY_LIMITS);
    if (accuracy.error) return accuracy;

    return {
        value: {
            ...(radius.value !== undefined && { attendance_radius_m: radius.value }),
            ...(accuracy.value !== undefined && { max_gps_accuracy_m: accuracy.value }),
        },
    };
}

function validateSubmittedCoordinates(lat, lng) {
    if (lat === undefined || lng === undefined || lat === null || lng === null || lat === "" || lng === "") {
        return {
            error: {
                code: "BRANCH_LOCATION_REQUIRED",
                error: "Debe guardar coordenadas reales de la sucursal.",
            },
        };
    }

    if (!hasValidBranchCoordinates(lat, lng)) {
        return {
            error: {
                code: "INVALID_BRANCH_LOCATION",
                error: "Las coordenadas de la sucursal no son vÃ¡lidas.",
            },
        };
    }

    return { value: { lat: parseFloat(lat), lng: parseFloat(lng) } };
}


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
            lng,
            attendance_radius_m,
            max_gps_accuracy_m,
        } = req.body;

        if(!nombre || !gerente || !RTN || id_municipio == null){
            return res.status(400).json({
                error: "Datos vacíos obligatorios"
            })
        }
        const location = validateSubmittedCoordinates(lat, lng);
        if (location.error) {
            return res.status(400).json(location.error);
        }
        const attendanceSettings = validateAttendanceLocationSettings(req.body);
        if (attendanceSettings.error) {
            return res.status(400).json(attendanceSettings.error);
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
                lat: location.value.lat,
                lng: location.value.lng,
                ...attendanceSettings.value,
                location_configured: true,
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
            lng,
            attendance_radius_m,
            max_gps_accuracy_m,
        } = req.body;

        const { id } = req.params;

        const check = await sucursal.findUnique({
            where: { id_sucursal: parseInt(id) }
        });

        if (!check) {
            return res.status(404).json({ error: "Sucursal no encontrada" });
        }

        const coordinatesSubmitted = lat !== undefined || lng !== undefined;
        if ((lat === undefined) !== (lng === undefined)) {
            return res.status(400).json({
                code: "INCOMPLETE_BRANCH_LOCATION",
                error: "Debe enviar latitud y longitud juntas.",
            });
        }
        const location = coordinatesSubmitted ? validateSubmittedCoordinates(lat, lng) : { value: null };
        if (location.error) {
            return res.status(400).json(location.error);
        }
        const attendanceSettings = validateAttendanceLocationSettings(req.body);
        if (attendanceSettings.error) {
            return res.status(400).json(attendanceSettings.error);
        }
        const updated = await sucursal.update({
            where: { id_sucursal: parseInt(id) },
            data: {
                ...(nombre !== undefined && { nombre }),
            ...(RTN !== undefined && { RTN }),
            ...(id_municipio !== undefined && { id_municipio: parseInt(id_municipio) }),
            ...(id_usuario !== undefined && { id_usuario: parseInt(id_usuario) }),
            ...(direccion !== undefined && { direccion }),
            ...(coordinatesSubmitted && { lat: location.value.lat }),
            ...(coordinatesSubmitted && { lng: location.value.lng }),
            ...attendanceSettings.value,
            ...(coordinatesSubmitted && { location_configured: true }),
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
