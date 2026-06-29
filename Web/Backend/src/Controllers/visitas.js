const visitasService = require("../Services/VisitasService");
const jsonwebtoken = require("jsonwebtoken");

const getVisitasProductoByProd = async (req, res, next) => {
    try {
        const result = await visitasService.getVisitasProductoByProd(req.params.prodId);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const createVisitaProd = async (req, res, next) => {
    try {
        let resolvedUserId = null;
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (token) {
            try {
                const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
                resolvedUserId = decoded.id_usuario;
            } catch (err) {}
        }

        const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
        const ua = req.headers["user-agent"] || "";

        const result = await visitasService.createVisitaProd({...req.body, ip, ua, resolvedUserId});
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const createBusquedaInterna = async (req, res, next) => {
    try {
        let resolvedUserId = null;
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (token) {
            try {
                const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
                resolvedUserId = decoded.id_usuario;
            } catch (err) {}
        }
        const result = await visitasService.createBusquedaInterna({ ...req.body, resolvedUserId });
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getTendencia = async (req, res, next) => {
    try {
        const result = await visitasService.getTendencia(req.query);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getTopProductos = async (req, res, next) => {
    try {
        const result = await visitasService.getTopProductos(req.query);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getSinVistas = async (req, res, next) => {
    try {
        const result = await visitasService.getSinVistas(req.query);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getComparativa = async (req, res, next) => {
    try {
        const result = await visitasService.getComparativa(req.query);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getDashboardAvanzado = async (req, res, next) => {
    try {
        const result = await visitasService.getDashboardAvanzado(req.query);
        res.json(result);
    } catch(error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

const getOportunidades = async (req, res, next) => {
    try {
        const result = await visitasService.getOportunidades(req.query);
        res.json(result);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        next(error);
    }
};

module.exports = {
    getVisitasProductoByProd,
    createVisitaProd,
    createBusquedaInterna,
    getTendencia,
    getTopProductos,
    getSinVistas,
    getComparativa,
    getDashboardAvanzado,
    getOportunidades
};
