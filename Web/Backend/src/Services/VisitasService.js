const prisma = require("../config/database");
const crypto = require("crypto");

const ALLOWED_SPEC_FILTERS = ['rin', 'ancho_rin', 'alto_rin', 'lonas', 'version', 'indice_de_carga', 'indice_velocidad', 'id_marca', 'id_categoria'];

const getFiltros = (query) => {
  const { fecha_inicio, fecha_fin, id_sucursal, ...specs } = query;
  const where = {};
  if (fecha_inicio && fecha_fin) {
    const fin = new Date(fecha_fin);
    fin.setHours(23, 59, 59, 999);
    where.fecha = {
      gte: new Date(fecha_inicio),
      lte: fin
    };
  }
  if (id_sucursal) {
    where.id_sucursal = parseInt(id_sucursal);
  }

  const productoWhere = {};
  for (const [key, value] of Object.entries(specs)) {
    if (ALLOWED_SPEC_FILTERS.includes(key) && value) {
      if (key === 'version') {
        productoWhere[key] = { contains: value };
      } else {
        // Limpiar el valor si viene con texto (ej: "Rin 15" -> 15)
        const cleanValue = typeof value === 'string' ? value.replace(/[^\d.-]/g, '') : value;
        const parsedValue = parseFloat(cleanValue);
        
        if (!isNaN(parsedValue)) {
          productoWhere[key] = parsedValue;
        }
      }
    }
  }

  if (Object.keys(productoWhere).length > 0) {
    where.producto = { is: productoWhere };
  }

  return where;
};

class VisitasService {

  async getVisitasProductoByProd(prodId) {
    const visitasProd = await prisma.producto_Visitas.findMany({
      where: { id_producto: parseInt(prodId) },
      include: {
        producto: true,
        sucursal: true,
        usuario: { select: { usuario: true, primer_nombre: true, primer_apellido: true } }
      }
    });
    return visitasProd;
  }

  async createVisitaProd({ id_producto, duracion_visita, fecha, id_sesion, id_sucursal, ip, ua, resolvedUserId }) {
    if (!id_producto || duracion_visita === undefined) {
      throw { status: 400, message: "Datos vacíos obligatorios" };
    }

    let id_usuario = resolvedUserId || null;

    if (!id_sesion) {
      id_sesion = crypto.createHash('md5').update(ip + ua).digest('hex');
    }

    let es_retorno = false;
    if (id_usuario || id_sesion) {
      const ultimaVisita = await prisma.producto_Visitas.findFirst({
        where: {
          OR: [
            { id_usuario: id_usuario || -1 },
            { id_sesion: id_sesion || "" }
          ],
          fecha: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        orderBy: { fecha: "desc" }
      });
      if (ultimaVisita) es_retorno = true;
    }

    const visitaProd = await prisma.producto_Visitas.create({
      data: {
        id_producto: parseInt(id_producto),
        duracion_visita: parseInt(duracion_visita),
        fecha: fecha ? new Date(fecha) : new Date(),
        id_usuario,
        id_sesion,
        id_sucursal: id_sucursal ? parseInt(id_sucursal) : null,
        es_invitado: !id_usuario,
        es_retorno
      }
    });
    return visitaProd;
  }

  async createBusquedaInterna({ termino, id_sesion, tuvo_resultado, resolvedUserId }) {
    let id_usuario = resolvedUserId || null;
    const busqueda = await prisma.busqueda_Interna.create({
      data: {
        termino,
        id_usuario,
        id_sesion,
        tuvo_resultado: !!tuvo_resultado
      }
    });
    return busqueda;
  }

  async getTendencia(query) {
    const where = getFiltros(query);
    const visitas = await prisma.producto_Visitas.groupBy({
      by: ['fecha'],
      _count: { _all: true },
      _avg: { duracion_visita: true },
      where
    });

    const tendenciaMap = visitas.reduce((acc, curr) => {
      const fecha = curr.fecha.toISOString().split('T')[0];
      if (!acc[fecha]) acc[fecha] = { vistas: 0, suma_segundos: 0 };
      acc[fecha].vistas += curr._count._all;
      acc[fecha].suma_segundos += (curr._avg.duracion_visita || 0) * curr._count._all;
      return acc;
    }, {});
    
    return Object.entries(tendenciaMap).map(([fecha, data]) => ({ 
      fecha, 
      total_vistas: data.vistas,
      promedio_atencion: data.vistas > 0 ? Math.round(data.suma_segundos / data.vistas) : 0
    }));
  }

  async getTopProductos(query) {
    const where = getFiltros(query);
    const vistas = await prisma.producto_Visitas.groupBy({
      by: ['id_producto'],
      _count: { _all: true },
      _avg: { duracion_visita: true },
      where
    });
    
    const compras = await prisma.pedido_Detalle.groupBy({
      by: ['id_producto'],
      _count: { _all: true },
      where: { pedido: { fecha: where.fecha, id_sucursal: where.id_sucursal } }
    });

    const productos = await prisma.producto.findMany({
      where: { id_producto: { in: vistas.map(v => v.id_producto) } },
      select: { 
        id_producto: true, 
        nombre: true,
        producto_imagen: { take: 1, orderBy: { orden: 'asc' }, select: { imagen_url: true } }
      }
    });

    const totalVistas = vistas.reduce((acc, v) => acc + v._count._all, 0);

    return vistas.map(v => {
      const p = productos.find(prod => prod.id_producto === v.id_producto);
      const c = compras.find(comp => comp.id_producto === v.id_producto);
      const ventas = c ? c._count._all : 0;
      let conversion = v._count._all > 0 ? (ventas / v._count._all) * 100 : 0;
      if (conversion > 100) conversion = 100;

      return {
        id_producto: v.id_producto,
        nombre: p ? p.nombre : 'Desconocido',
        vistas: v._count._all,
        porcentaje_vistas: totalVistas > 0 ? parseFloat(((v._count._all / totalVistas) * 100).toFixed(1)) : 0,
        tiempo_promedio_segundos: Math.round(v._avg.duracion_visita || 0),
        ventas: ventas,
        conversion: parseFloat(conversion.toFixed(1)),
        imagen_url: p?.producto_imagen[0]?.imagen_url ? p.producto_imagen[0].imagen_url.replace(/^\/+/, '') : null
      };
    });
  }

  async getSinVistas(query) {
    const baseFiltros = getFiltros(query);
    const productoSpecs = baseFiltros.producto?.is || {};
    
    // Si hay fecha_inicio local, usarla como el punto de corte. 
    // De lo contrario usar el cálculo por días.
    const dias = parseInt(query.dias) || 30;
    let fechaLimite;
    if (query.fecha_inicio) {
      fechaLimite = new Date(query.fecha_inicio);
    } else {
      fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
    }

    const productos = await prisma.producto.findMany({
      where: {
        estado: true,
        ...productoSpecs,
        producto_visitas: { 
          none: { 
            fecha: { gte: fechaLimite },
            id_sucursal: baseFiltros.id_sucursal
          } 
        }
      },
      include: {
        producto_visitas: { orderBy: { fecha: 'desc' }, take: 1 },
        producto_imagen: { take: 1, orderBy: { orden: 'asc' }, select: { imagen_url: true } }
      }
    });

    const results = productos.map(p => {
      const ultimaVisita = p.producto_visitas[0];
      const diasSinVista = ultimaVisita 
        ? Math.floor((new Date() - new Date(ultimaVisita.fecha)) / (1000 * 60 * 60 * 24))
        : dias;
      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        dias_sin_vista: diasSinVista,
        tiempo_atencion: ultimaVisita ? (ultimaVisita.duracion_visita || 0) : 0,
        imagen_url: p.producto_imagen[0]?.imagen_url ? p.producto_imagen[0].imagen_url.replace(/^\/+/, '') : null
      };
    });

    return results.sort((a, b) => b.dias_sin_vista - a.dias_sin_vista);
  }

  async getComparativa(query) {
    const { fecha_inicio, fecha_fin, id_sucursal } = query;
    if (!fecha_inicio || !fecha_fin) {
      throw { status: 400, message: "Fechas requeridas" };
    }

    const start = new Date(fecha_inicio);
    const end = new Date(fecha_fin);
    const diff = end - start;
    
    const startAnt = new Date(start.getTime() - diff - 24 * 60 * 60 * 1000);
    const endAnt   = new Date(start.getTime() - 1); 

    const whereActual  = getFiltros({ fecha_inicio, fecha_fin, id_sucursal });
    const whereAnterior = getFiltros({
      fecha_inicio: startAnt.toISOString(),
      fecha_fin:    endAnt.toISOString(),
      id_sucursal
    });

    const actual   = await prisma.producto_Visitas.count({ where: whereActual });
    const anterior = await prisma.producto_Visitas.count({ where: whereAnterior });

    const variacion = anterior === 0
      ? (actual > 0 ? 100 : 0)
      : ((actual - anterior) / anterior) * 100;

    return {
      periodo_actual:   actual,
      periodo_anterior: anterior,
      variacion_pct:    parseFloat(variacion.toFixed(2))
    };
  }

  async getDashboardAvanzado(query) {
    const where = getFiltros(query);
    const vistasRaw = await prisma.producto_Visitas.findMany({
      where,
      include: { producto: { include: { categoria: true, marca: true } } }
    });

    const totalVistas = vistasRaw.length;
    if (totalVistas === 0) return { segmentos: {}, comportamiento: {}, insights: {} };

    const segmentos = { rin: {}, categoria: {}, marca: {} };
    const productosVistasTiempo = {};

    vistasRaw.forEach(v => {
      const rin = `Rin ${v.producto.rin}`;
      segmentos.rin[rin] = (segmentos.rin[rin] || 0) + 1;
      
      const cat = v.producto.categoria?.nombre || 'General';
      segmentos.categoria[cat] = (segmentos.categoria[cat] || 0) + 1;

      const mrk = v.producto.marca?.nombre || 'Genérica';
      segmentos.marca[mrk] = (segmentos.marca[mrk] || 0) + 1;

      if (!productosVistasTiempo[v.id_producto]) {
        productosVistasTiempo[v.id_producto] = { nombre: v.producto.nombre, vistas: 0, tiempoTotal: 0 };
      }
      productosVistasTiempo[v.id_producto].vistas++;
      productosVistasTiempo[v.id_producto].tiempoTotal += v.duracion_visita || 0;
    });

    const groupbySesion = await prisma.producto_Visitas.groupBy({
      by: ['id_sesion'],
      _count: { _all: true },
      where: { ...where, id_sesion: { not: null } }
    });
    const paginasPorSesion = groupbySesion.length > 0 
      ? (groupbySesion.reduce((acc, s) => acc + s._count._all, 0) / groupbySesion.length) 
      : 1;

    const globalTiempoPromedio = vistasRaw.reduce((acc, v) => acc + (v.duracion_visita || 0), 0) / totalVistas;
    let nivelInteraccion = 'Normal';
    if (globalTiempoPromedio > 30) nivelInteraccion = 'Alto';
    if (globalTiempoPromedio < 10) nivelInteraccion = 'Bajo';

    let insight_principal = '';
    const isBajo = paginasPorSesion < 1.5 || globalTiempoPromedio < 15;
    if (totalVistas > 100 && isBajo) insight_principal = 'Alto tráfico pero baja retención (interés rápido o rebote)';
    else if (totalVistas > 100 && !isBajo) insight_principal = 'Audiencia altamente comprometida (exploran a fondo)';
    else if (totalVistas < 50 && !isBajo) insight_principal = 'Poco tráfico pero interés profundo en productos específicos';
    else insight_principal = 'Tráfico estable con nivel de interacción estándar';

    const insights_lista = [];
    const rinMasPopular = Object.entries(segmentos.rin).sort((a, b) => b[1] - a[1])[0];
    if (rinMasPopular) {
      const pct = Math.round((rinMasPopular[1] / totalVistas) * 100);
      insights_lista.push(`El tamaño ${rinMasPopular[0]} concentra el ${pct}% del interés de los clientes.`);
    }

    const statsAvgProps = Object.values(productosVistasTiempo).map(p => ({
      ...p,
      promedio: p.vistas > 0 ? p.tiempoTotal / p.vistas : 0
    }));

    const maxVistasProd = [...statsAvgProps].sort((a, b) => b.vistas - a.vistas)[0];
    if (maxVistasProd && maxVistasProd.promedio < 10) {
      insights_lista.push(`"${maxVistasProd.nombre}" es muy visto pero descartado rápido (promedio ${Math.round(maxVistasProd.promedio)}s).`);
    }
    
    const maxTiempoProd = [...statsAvgProps].filter(p => p.vistas > 2).sort((a, b) => b.promedio - a.promedio)[0];
    if (maxTiempoProd && maxTiempoProd.promedio > 30) {
      insights_lista.push(`"${maxTiempoProd.nombre}" tiene altísima retención de atención (${Math.round(maxTiempoProd.promedio)}s en promedio).`);
    }

    if (nivelInteraccion === 'Bajo') insights_lista.push('Los usuarios solo echan un vistazo rápido. Podrías mejorar las fotos principales o resumir mejor la info.');
    else if (nivelInteraccion === 'Alto') insights_lista.push('Los usuarios realmente analizan las fichas técnicas y descripciones.');

    return {
      segmentos: {
        rin: Object.entries(segmentos.rin).map(([k,v]) => ({ segmento: k, valor: v })),
        categoria: Object.entries(segmentos.categoria).map(([k,v]) => ({ segmento: k, valor: v })),
        marca: Object.entries(segmentos.marca).map(([k,v]) => ({ segmento: k, valor: v }))
      },
      comportamiento: {
        paginas_por_sesion: parseFloat(paginasPorSesion.toFixed(1)),
        nivel_interaccion: nivelInteraccion,
        tiempo_promedio_general: Math.round(globalTiempoPromedio)
      },
      insights: { principal: insight_principal, lista: insights_lista }
    };
  }

  async getOportunidades(query) {
    const where = getFiltros(query);

    const vistas = await prisma.producto_Visitas.groupBy({
      by: ['id_producto'],
      _count: { id_producto: true },
      _avg: { duracion_visita: true },
      where: where,
      orderBy: { _count: { id_producto: 'desc' } }
    });

    if (vistas.length === 0) return [];

    const productos = await prisma.producto.findMany({
      where: { id_producto: { in: vistas.map(v => v.id_producto) } },
      select: {
        id_producto: true,
        nombre: true,
        producto_imagen: { take: 1, orderBy: { orden: 'asc' }, select: { imagen_url: true } }
      }
    });

    const ventasProductos = await prisma.pedido_Detalle.groupBy({
      by: ['id_producto'],
      _count: { _all: true },
      where: {
        id_producto: { in: vistas.map(v => v.id_producto) },
        pedido: { id_sucursal: where.id_sucursal, fecha: where.fecha }
      }
    });

    const oportunidades = vistas.map(v => {
      const p = productos.find(prod => prod.id_producto === v.id_producto);
      const vp = ventasProductos.find(vent => vent.id_producto === v.id_producto);
      const ventas = vp ? vp._count._all : 0;
      const vistasCount = v._count.id_producto;
      const conversion = Math.min(100, (ventas / vistasCount) * 100);

      return {
        id_producto: v.id_producto,
        nombre: p ? p.nombre : 'Desconocido',
        vistas: vistasCount,
        ventas: ventas,
        conversion: parseFloat(conversion.toFixed(1)),
        tiempo_atencion: Math.round(v._avg.duracion_visita || 0),
        imagen_url: p?.producto_imagen[0]?.imagen_url ? p.producto_imagen[0].imagen_url.replace(/^\/+/, '') : null
      };
    });

    const min_conversion = (query.min_conversion !== undefined && query.min_conversion !== "") ? parseFloat(query.min_conversion) : 0;
    const max_conversion = (query.max_conversion !== undefined && query.max_conversion !== "") ? parseFloat(query.max_conversion) : 10;

    return oportunidades
      .filter(o => o.conversion >= min_conversion && o.conversion <= max_conversion)
      .sort((a, b) => a.conversion - b.conversion);
  }
}

module.exports = new VisitasService();
