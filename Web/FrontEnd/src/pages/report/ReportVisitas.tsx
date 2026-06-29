import { useState, useEffect, useRef } from 'react';
import {
  Download, Eye, RefreshCcw, ArrowUp, ArrowDown,
  Clock, AlertCircle, Target
} from 'lucide-react';
import {
  getTendencia,
  getTopProductos,
  getSinVistas,
  getComparativa,
  getDashboardAvanzado,
  getOportunidades
} from '../../api/reportes/reportes';
import type {
  TendenciaData,
  TopProductoData,
  SinVistasData,
  ComparativaData,
  DashboardAvanzadoData
} from '../../api/reportes/reportes';
import { FilterBar } from '../../components/FilterBar';
import { SinVistasTable, OportunidadesTable, TopProductosTable } from '../../components/report/ReportTables';
import dayjs, { Dayjs } from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, Label
} from 'recharts';
import { getAllActiveBranches } from '../../api/branches/branches';
import { getMarcas } from '../../api/products/marcas';
import { getCategorias } from '../../api/products/categorias';

const COLORS = ['#027EB1', '#003E7B', '#8EBCD1', '#D61216', '#FBBF24', '#10B981', '#6B7280', '#F472B6'];

export default function ReportVisitas() {
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(dayjs().endOf('month'));
  const [sucursal, setSucursal] = useState<string>('');


  // Opciones dinámicas
  const [sucursales, setSucursales] = useState<{ label: string, value: string }[]>([]);
  const [marcas, setMarcas] = useState<{ id: number, nombre: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: number, nombre: string }[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [tendencia, setTendencia] = useState<TendenciaData[]>([]);
  const [topProductos, setTopProductos] = useState<TopProductoData[]>([]);
  const [sinVistas, setSinVistas] = useState<SinVistasData[]>([]);
  const [oportunidades, setOportunidades] = useState<TopProductoData[]>([]);
  const [comparativa, setComparativa] = useState<ComparativaData | null>(null);
  const [dashboardAvz, setDashboardAvz] = useState<DashboardAvanzadoData | null>(null);

  const topTableRef = useRef<any>(null);
  const sinVistasRef = useRef<any>(null);
  const oportunidadesRef = useRef<any>(null);

  const scrollToTable = (ref: any, id: string) => {
    if (ref.current) {
      ref.current.expand();
    }
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleChartClick = (key: string, value: any) => {
    if (topTableRef.current) {
      let filterValue = value;

      // Limpiar filtros previos antes de aplicar el nuevo (específicamente rin, marca, categoría)
      topTableRef.current.clearAll();

      // Mapeo de nombre a ID si es necesario
      if (key === 'id_marca') {
        const marca = marcas.find(m => m.nombre === value);
        if (marca) filterValue = marca.id;
      } else if (key === 'id_categoria') {
        const cat = categorias.find(c => c.nombre === value);
        if (cat) filterValue = cat.id;
      } else if (key === 'rin' && typeof value === 'string') {
        // Extraer solo el número de "Rin 15"
        filterValue = value.replace(/[^\d.-]/g, '');
      }

      topTableRef.current.applyFilter(key, filterValue);
      // Scroll to table with a small delay to allow expansion if needed
      setTimeout(() => {
        const tableElement = document.getElementById('top-productos-table');
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [sucRes, marcasRes, catsRes] = await Promise.all([
        getAllActiveBranches(),
        getMarcas(),
        getCategorias()
      ]);

      setSucursales(Array.from(new Set(sucRes.map(s => s.id_sucursal))).map(id => {
        const s = sucRes.find(x => x.id_sucursal === id)!;
        return { label: s.nombre, value: String(s.id_sucursal) };
      }));

      setMarcas(marcasRes.map(m => ({ id: m.id_marca, nombre: m.nombre })));
      setCategorias(catsRes.map(c => ({ id: c.id_categoria, nombre: c.nombre })));
    } catch (error) {
      console.error('Error cargando opciones de filtros', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin, sucursal]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio.format('YYYY-MM-DD');
      if (fechaFin) params.fecha_fin = fechaFin.format('YYYY-MM-DD');
      if (sucursal) params.id_sucursal = sucursal;

      const [
        tendenciaRes,
        topProdRes,
        sinVistasRes,
        compRes,
        advRes,
        oportRes
      ] = await Promise.all([
        getTendencia(params),
        getTopProductos(params),
        getSinVistas(params), 
        getComparativa(params),
        getDashboardAvanzado(params),
        getOportunidades(params)
      ]);

      setTendencia(tendenciaRes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
      setTopProductos(topProdRes.sort((a, b) => b.vistas - a.vistas));
      setSinVistas(sinVistasRes);
      setOportunidades(oportRes);
      setComparativa(compRes);
      setDashboardAvz(advRes);
    } catch (error) {
      console.error('Error al obtener datos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [0, 62, 123];

    doc.setFontSize(18);
    doc.setTextColor(2, 126, 177);
    doc.text('Reporte Analítico Integrado de Vistas', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(74, 74, 74);
    doc.text(`Generado: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 30);
    if (fechaInicio) doc.text(`Periodo: ${fechaInicio.format('DD/MM/YYYY')} - ${fechaFin?.format('DD/MM/YYYY')}`, 14, 36);

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Tabla 1: Top 10 Productos con más Vistas', 14, 48);

    autoTable(doc, {
      head: [['Pos', 'Producto', 'Vistas', 'Ventas', 'Atención (s)']],
      body: topProductos.slice(0, 10).map((p: TopProductoData, i: number) => [
        i + 1,
        p.nombre,
        p.vistas,
        p.ventas || 0,
        p.tiempo_promedio_segundos || 0
      ]),
      startY: 52,
      headStyles: { fillColor: primaryColor as [number, number, number] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Tabla 2: Top 10 Segmentos por Tamaño de Rin', 14, currentY);
    autoTable(doc, {
      head: [['Pos', 'Tamaño de Rin', 'Volumen de Vistas']],
      body: (dashboardAvz?.segmentos?.rin || [])
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10)
        .map((s: { segmento: string; valor: number }, i: number) => [i + 1, s.segmento, s.valor]),
      startY: currentY + 4,
      headStyles: { fillColor: [2, 126, 177] as [number, number, number] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.text('Tabla 3: Top 10 Segmentos por Tipo de Llanta', 14, currentY);
    autoTable(doc, {
      head: [['Pos', 'Tipo de Llanta', 'Volumen de Vistas']],
      body: (dashboardAvz?.segmentos?.categoria || [])
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10)
        .map((s: { segmento: string; valor: number }, i: number) => [i + 1, s.segmento, s.valor]),
      startY: currentY + 4,
      headStyles: { fillColor: [16, 185, 129] as [number, number, number] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.text('Tabla 4: Top 10 Marcas más Consultadas', 14, currentY);
    autoTable(doc, {
      head: [['Pos', 'Marca', 'Volumen de Vistas']],
      body: (dashboardAvz?.segmentos?.marca || [])
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10)
        .map((s: { segmento: string; valor: number }, i: number) => [i + 1, s.segmento, s.valor]),
      startY: currentY + 4,
      headStyles: { fillColor: [139, 92, 246] as [number, number, number] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.text(`Tabla 5: Llantas sin Vistas (> 30 días)`, 14, currentY);
    autoTable(doc, {
      head: [['Pos', 'Producto', 'ID Producto', 'Días sin Vistas', 'Últ. Atención']],
      body: sinVistas.slice(0, 10).map((p: SinVistasData, i: number) => [
        i + 1,
        p.nombre,
        p.id_producto,
        `${p.dias_sin_vista} días`,
        `${p.tiempo_atencion || 0}s`
      ]),
      startY: currentY + 4,
      headStyles: { fillColor: [249, 115, 22] as [number, number, number] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.text(`Tabla 6: Oportunidades (Efectividad de Ventas)`, 14, currentY);
    autoTable(doc, {
      head: [['Pos', 'Producto', 'Vistas', 'Ventas', 'Atención', 'Efectividad']],
      body: oportunidades.slice(0, 10).map((p: TopProductoData, i: number) => [
        i + 1,
        p.nombre,
        p.vistas,
        p.ventas || 0,
        `${p.tiempo_promedio_segundos || 0}s`,
        `${p.conversion}%`
      ]),
      startY: currentY + 4,
      headStyles: { fillColor: [220, 38, 38] as [number, number, number] }
    });

    doc.save(`reporte_analitico_llantas_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Función auxiliar para construir hojas con diseño profesional
    const createSheetWithStyle = (sheetName: string, columnsDef: any[], dataRows: any[]) => {
      const sheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: false, state: 'frozen', xSplit: 1, ySplit: 2 }]
      });

      // Regla de Espacio: Columna A estrecha y fila 1 vacía
      sheet.getColumn('A').width = 3;

      const headerRow = sheet.getRow(2);
      headerRow.height = 25;

      columnsDef.forEach((col, idx) => {
        const currentColumn = sheet.getColumn(idx + 2); // Arrancamos en B
        currentColumn.width = col.width || 15;
        
        const cell = headerRow.getCell(idx + 2);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Texto blanco
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003E7B' } }; // Azul oscuro corporativo
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'FF000000' } }
        };
      });

      if (dataRows.length === 0) {
        // Datos 'Dummy' si no hay registros, con formato gris para indicar que está esperando datos
        const emptyRow = sheet.getRow(3);
        columnsDef.forEach((col, idx) => {
          const cell = emptyRow.getCell(idx + 2);
          cell.value = typeof col.fallback === 'string' ? "Sin datos" : 0;
          cell.font = { italic: true, color: { argb: 'FF9CA3AF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Gris muy tenue
          cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
          if (col.format) cell.numFmt = col.format;
        });
      } else {
        // Filas reales
        dataRows.forEach((row, rIndex) => {
          const excelRow = sheet.getRow(rIndex + 3);
          columnsDef.forEach((col, cIndex) => {
            const cell = excelRow.getCell(cIndex + 2);
            cell.value = row[col.key];
            cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
            if (col.format) cell.numFmt = col.format;
          });
        });
      }
    };

    // DEFINIMOS ESTRUCTURA DE LAS 3 HOJAS
    const topCols = [
      { header: "Posición", key: "pos", width: 10, align: "center", fallback: 1 },
      { header: "Producto", key: "nombre", width: 50, fallback: "string" },
      { header: "Total Vistas", key: "vistas", width: 15, align: "center", format: "#,##0", fallback: 0 },
      { header: "Total Ventas", key: "ventas", width: 15, align: "center", format: "#,##0", fallback: 0 },
      { header: "Atención (segundos)", key: "atencion", width: 20, align: "center", format: "0.0", fallback: 0 }
    ];

    createSheetWithStyle(
      "Top Productos", 
      topCols, 
      topProductos.map((p, i) => ({
        pos: i + 1, nombre: p.nombre, vistas: p.vistas, ventas: p.ventas || 0,
        atencion: p.tiempo_promedio_segundos || 0
      }))
    );

    createSheetWithStyle(
      "Sin Movimiento",
      [
        { header: "Posición", key: "pos", width: 10, align: "center", fallback: 1 },
        { header: "Producto", key: "nombre", width: 50, fallback: "string" },
        { header: "Días Inactivo", key: "dias", width: 20, align: "center", format: "0 \"días\"", fallback: 0 }
      ],
      sinVistas.map((p, i) => ({
        pos: i + 1, nombre: p.nombre, dias: p.dias_sin_vista
      }))
    );

    createSheetWithStyle(
      "Oportunidades",
      topCols,
      oportunidades.map((p, i) => ({
        pos: i + 1, nombre: p.nombre, vistas: p.vistas, ventas: p.ventas || 0,
        atencion: p.tiempo_promedio_segundos || 0, conversion: (p.conversion || 0) / 100
      }))
    );

    createSheetWithStyle(
      "Vistas por Rin",
      [
        { header: "Posición", key: "pos", width: 10, align: "center", fallback: 1 },
        { header: "Tamaño de Rin", key: "segmento", width: 30, fallback: "string" },
        { header: "Volumen de Vistas", key: "valor", width: 20, align: "center", format: "#,##0", fallback: 0 }
      ],
      (dashboardAvz?.segmentos?.rin || []).slice().sort((a,b)=>b.valor-a.valor).map((s, i) => ({
        pos: i + 1, segmento: s.segmento, valor: s.valor
      }))
    );
    
    createSheetWithStyle(
      "Vistas por Tipo Llanta",
      [
        { header: "Posición", key: "pos", width: 10, align: "center", fallback: 1 },
        { header: "Tipo de Llanta", key: "segmento", width: 40, fallback: "string" },
        { header: "Volumen de Vistas", key: "valor", width: 20, align: "center", format: "#,##0", fallback: 0 }
      ],
      (dashboardAvz?.segmentos?.categoria || []).slice().sort((a,b)=>b.valor-a.valor).map((s, i) => ({
        pos: i + 1, segmento: s.segmento, valor: s.valor
      }))
    );

    createSheetWithStyle(
      "Vistas por Marca",
      [
        { header: "Posición", key: "pos", width: 10, align: "center", fallback: 1 },
        { header: "Marca", key: "segmento", width: 30, fallback: "string" },
        { header: "Volumen de Vistas", key: "valor", width: 20, align: "center", format: "#,##0", fallback: 0 }
      ],
      (dashboardAvz?.segmentos?.marca || []).slice().sort((a,b)=>b.valor-a.valor).map((s, i) => ({
        pos: i + 1, segmento: s.segmento, valor: s.valor
      }))
    );

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Dashboard_Reporte_${dayjs().format('YYYY_MM_DD')}.xlsx`);
  };

  const handleClearFilters = () => {
    setFechaInicio(dayjs().startOf('month'));
    setFechaFin(dayjs().endOf('month'));
    setSucursal('');
  };

  const baseParams: any = {};
  if (fechaInicio) baseParams.fecha_inicio = fechaInicio.format('YYYY-MM-DD');
  if (fechaFin) baseParams.fecha_fin = fechaFin.format('YYYY-MM-DD');
  if (sucursal) baseParams.id_sucursal = sucursal;

  const atencionPromedio = topProductos.length > 0
    ? Math.round(topProductos.reduce((acc: number, p: TopProductoData) => acc + (p.tiempo_promedio_segundos || 0), 0) / topProductos.length)
    : 0;

  const rangeText = fechaInicio && fechaFin
    ? `Del ${fechaInicio.format('DD/MM')} al ${fechaFin.format('DD/MM')}`
    : "Periodo seleccionado";

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Reporte de Visitas</h1>
            <p className="text-[#6b7280]">Desempeño del catálogo e interés de clientes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="h-11 px-6 bg-[#10B981] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#059669] transition-all font-semibold shadow-sm"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Excel</span>
              <span className="sm:hidden">XLSX</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="h-11 px-6 bg-[#DC2626] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#B91C1C] transition-all font-semibold shadow-sm"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Reporte (PDF)</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 mb-8">
          <FilterBar
            filters={[
              {
                placeholder: 'Seleccionar Sucursal',
                value: sucursal || undefined,
                onChange: (v) => setSucursal(v ? String(v) : ''),
                className: 'lg:flex-[4]',
                options: sucursales,
              },
            ]}
            fechaInicio={{ value: fechaInicio, onChange: (date) => setFechaInicio(date), placeholder: 'Desde', className: 'lg:flex-[1.5]' }}
            fechaFin={{ value: fechaFin, onChange: (date) => setFechaFin(date), placeholder: 'Hasta', className: 'lg:flex-[1.5]' }}
            onClear={handleClearFilters}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCcw className="w-12 h-12 text-[#027EB1] animate-spin" />
            <p className="text-gray-500 font-medium">Generando métricas consolidadas...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard
                title="Vistas Totales"
                value={comparativa?.periodo_actual || 0}
                subValue={rangeText}
                icon={<Eye className="w-6 h-6 text-[#027EB1]" />}
              />
              <KpiCard
                title="Atención Promedio"
                value={`${atencionPromedio}s`}
                subValue={rangeText}
                icon={<Clock className="w-6 h-6 text-[#F59E0B]" />}
              />

              <KpiCard
                title="Sin Movimiento"
                value={sinVistas.length}
                subValue={rangeText}
                icon={<AlertCircle className="w-6 h-6 text-[#F97316]" />}
                colorTheme="orange"
                onClick={() => scrollToTable(sinVistasRef, 'sin-vistas-table')}
              />
              <KpiCard
                title="Oportunidades"
                value={oportunidades.length}
                subValue={rangeText}
                icon={<Target className="w-6 h-6 text-[#DC2626]" />}
                colorTheme="red"
                onClick={() => scrollToTable(oportunidadesRef, 'oportunidades-table')}
              />
            </div>

            {/* Gráfica Única (Tendencia de Tráfico) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 overflow-hidden mb-8">
              <h3 className="text-lg font-bold text-[#003E7B] mb-6">Tendencia de Tráfico Diaria</h3>
              <div className="h-[350px] flex items-center justify-center">
                {tendencia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendencia} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(v: any) => dayjs(v).format('DD/MM')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        height={70}
                      >
                        <Label value="Fecha de Consulta" offset={10} position="insideBottom" style={{ fill: '#4b5563', fontSize: '12px', fontWeight: 'bold' }} />
                      </XAxis>
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} width={40}>
                        <Label value="Total de Vistas" angle={-90} position="insideLeft" offset={0} style={{ fill: '#4b5563', fontSize: '10px', fontWeight: 'bold', textAnchor: 'middle' }} />
                      </YAxis>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} labelFormatter={(v: any) => dayjs(v).format('DD MMM, YYYY')} />
                      <Line
                        type="monotone"
                        dataKey="total_vistas"
                        stroke="#027EB1"
                        strokeWidth={4}
                        dot={{ r: 4, fill: '#027EB1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400">Sin datos de tendencia</p>}
              </div>
            </div>

            {/* Segments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SegmentCard
                title="Vistas por Tamaño de Rin"
                data={dashboardAvz?.segmentos?.rin || []}
                color="#027EB1"
                onClick={(val: any) => handleChartClick('rin', val.segmento)}
              />
              <SegmentCard
                title="Vistas por Tipo de Llanta"
                data={dashboardAvz?.segmentos?.categoria || []}
                color="#10B981"
                onClick={(val: any) => handleChartClick('id_categoria', val.segmento)}
              />
              <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
                <h3 className="text-lg font-bold text-[#003E7B] mb-6">Vistas por Marca</h3>
                <div className="h-[250px] flex items-center justify-center">
                  {dashboardAvz?.segmentos?.marca && dashboardAvz.segmentos.marca.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardAvz.segmentos.marca}
                          dataKey="valor"
                          nameKey="segmento"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          onClick={(data: any) => handleChartClick('id_marca', data.segmento)}
                          className="cursor-pointer"
                        >
                          {dashboardAvz.segmentos.marca.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-sm">Sin datos de marcas</p>}
                </div>
              </div>
            </div>

            {/* Tablas Renderizadas Siempre (Sección Expandida por Defecto) */}
            <div className="space-y-8 mb-8">
              <div id="top-productos-table">
                <TopProductosTable
                  ref={topTableRef}
                  initialData={topProductos}
                  baseParams={baseParams}
                  rangeText={rangeText}
                />
              </div>

              <div id="sin-vistas-table">
                <SinVistasTable
                  ref={sinVistasRef}
                  initialData={sinVistas}
                  baseParams={baseParams}
                  rangeText={rangeText}
                />
              </div>

              <div id="oportunidades-table">
                <OportunidadesTable
                  ref={oportunidadesRef}
                  initialData={oportunidades}
                  baseParams={baseParams}
                  rangeText={rangeText}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, subValue, trend, icon, warning = false, isActive = false, onClick, colorTheme = "blue" }: any) {
  const themes: any = {
    blue: { active: "bg-[#EAF7FD] border-[#027EB1] ring-1 ring-[#027EB1]", iconBg: "bg-blue-50", text: "text-[#027EB1]" },
    emerald: { active: "bg-[#ECFDF5] border-[#10B981] ring-1 ring-[#10B981]", iconBg: "bg-emerald-50", text: "text-[#10B981]" },
    orange: { active: "bg-[#FFF7ED] border-[#F97316] ring-1 ring-[#F97316]", iconBg: "bg-orange-50", text: "text-[#F97316]" },
    red: { active: "bg-[#FEF2F2] border-[#DC2626] ring-1 ring-[#DC2626]", iconBg: "bg-red-50", text: "text-[#DC2626]" }
  };
  const theme = themes[colorTheme] || themes.blue;

  const [isHovered, setIsHovered] = useState(false);
  const [shouldScrollTitle, setShouldScrollTitle] = useState(false);
  const [shouldScrollSub, setShouldScrollSub] = useState(false);

  const titleContainerRef = (el: HTMLDivElement | null) => {
    if (el) setShouldScrollTitle(el.scrollWidth > el.clientWidth);
  };

  const subValueContainerRef = (el: HTMLDivElement | null) => {
    if (el) setShouldScrollSub(el.scrollWidth > el.clientWidth);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between cursor-pointer hover:shadow-lg active:scale-[0.98] group ${isActive ? theme.active : "border-[#e5e7eb]"} ${warning && !isActive ? 'border-red-200' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div
            ref={titleContainerRef}
            className="overflow-hidden whitespace-nowrap relative mb-2"
          >
            <div
              className={`inline-block transition-transform duration-[4000ms] ease-linear`}
              style={{
                transform: isHovered && shouldScrollTitle ? 'translateX(calc(-100% + 150px))' : 'translateX(0)'
              }}
            >
              <p className={`text-sm font-medium ${isActive ? theme.text : 'text-gray-500'}`}>{title}</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 leading-tight">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-white/50" : (warning ? 'bg-red-50' : theme.iconBg)}`}>{icon}</div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div
          ref={subValueContainerRef}
          className="overflow-hidden whitespace-nowrap flex-1 pr-2 relative"
        >
          <div
            className={`inline-block transition-transform duration-[4000ms] ease-linear`}
            style={{
              transform: isHovered && shouldScrollSub ? 'translateX(calc(-100% + 150px))' : 'translateX(0)'
            }}
          >
            <p className={`text-sm ${isActive ? theme.text : 'text-gray-500'}`}>
              {subValue}
            </p>
          </div>
        </div>
        {(trend !== undefined && trend !== null) && (
          <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentCard({ title, data, color, onClick }: { title: string, data: any[], color: string, onClick?: (val: any) => void }) {
  const sorted = [...data].sort((a, b) => b.valor - a.valor).slice(0, 5);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
      <h3 className="text-lg font-bold text-[#003E7B] mb-6">{title}</h3>
      <div className="h-[250px] flex items-center justify-center">
        {sorted.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0) {
                  onClick?.(data.activePayload[0].payload);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis dataKey="segmento" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 10, fill: '#4b5563' }} />
              <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="valor" fill={color} radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-sm">Sin datos de segmento</p>}
      </div>
    </div>
  );
}
