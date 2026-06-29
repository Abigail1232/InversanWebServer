// ─── Helpers de paginación ───────────────────────────────────────────────────

/**
 * Extrae y normaliza los parámetros de paginación del query
 * page y limit tienen valores default si no se mandan
 */
function getPagination(query) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 6
    const skip = (page - 1) * limit
    return { page, limit, skip }
}

/**
 * Estructura de respuesta paginada
 * El frontend puede usar totalPages para renderizar el paginador
 * y totalRows para mostrar el total de resultados
 */
function paginatedResponse(data, totalRows, page, limit) {
    return {
        data,
        totalRows,
        page,
        totalPages: Math.ceil(totalRows / limit)
    }
}

module.exports = {
    getPagination,
    paginatedResponse
}