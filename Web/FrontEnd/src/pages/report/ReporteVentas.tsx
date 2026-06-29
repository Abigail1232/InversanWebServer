import { useState, useEffect } from "react";
import {
  Download,
  RefreshCcw,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  User,
  Mail,
  Phone,
  Package,
  Truck,
} from "lucide-react";
import {
  getFacturas,
  type Factura,
  type FiltroFacturasParams,
} from "../../api/reportes/ventas";
import { FilterBar } from "../../components/FilterBar";
import dayjs, { Dayjs } from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";

const COLORS = [
  "#027EB1",
  "#10B981",
  "#F59E0B",
  "#DC2626",
  "#8B5CF6",
  "#EC4899",
];

export default function ReporteVentas() {
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>("");
  const [marca, setMarca] = useState<string>("");
  const [sucursal, setSucursal] = useState<string>("");
  const [tipoCliente, setTipoCliente] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [todasFacturas, setTodasFacturas] = useState<Factura[]>([]); // Para las gráficas (sin paginar)
  const [ventasHoy, setVentasHoy] = useState<number>(0);
  const [modalVenta, setModalVenta] = useState<Factura | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
    fetchTodasFacturas();
  }, [fechaInicio, fechaFin, metodoPago, marca, sucursal, tipoCliente, currentPage]);

  useEffect(() => {
    fetchVentasHoy();
  }, [sucursal]); // Solo depende de la sucursal si queremos filtrar hoy por sucursal, o nada si es global

  const fetchVentasHoy = async () => {
    try {
      const hoyStr = dayjs().format("YYYY-MM-DD");
      const params: FiltroFacturasParams = { 
        page: 1, 
        limit: 1, // Solo nos interesa el total_registros
        fecha_inicio: hoyStr,
        fecha_fin: hoyStr
      };
      if (sucursal && sucursal !== "todas") params.sucursal = sucursal;
      
      const res = await getFacturas(params);
      setVentasHoy(res.total_registros || 0);
    } catch (error) {
      console.error("Error al obtener ventas de hoy", error);
    }
  };

  // Trae todas las facturas filtradas (sin paginar) para alimentar las gráficas
  const fetchTodasFacturas = async () => {
    try {
      const params: FiltroFacturasParams = { page: 1, limit: 5000 };
      if (fechaInicio) params.fecha_inicio = fechaInicio.format("YYYY-MM-DD");
      if (fechaFin) params.fecha_fin = fechaFin.format("YYYY-MM-DD");
      if (metodoPago && metodoPago !== "todos") params.metodo_pago = metodoPago;
      if (marca && marca !== "todas") params.marca = marca;
      if (sucursal && sucursal !== "todas") params.sucursal = sucursal;
      if (tipoCliente && tipoCliente !== "todos") params.tipo_cliente = tipoCliente;
      const res = await getFacturas(params);
      setTodasFacturas(res.data || []);
    } catch (error) {
      console.error("Error al obtener todas las facturas", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: FiltroFacturasParams = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (fechaInicio) params.fecha_inicio = fechaInicio.format("YYYY-MM-DD");
      if (fechaFin) params.fecha_fin = fechaFin.format("YYYY-MM-DD");
      if (metodoPago && metodoPago !== "todos") params.metodo_pago = metodoPago;
      if (marca && marca !== "todas") params.marca = marca;
      if (sucursal && sucursal !== "todas") params.sucursal = sucursal;
      if (tipoCliente && tipoCliente !== "todos") params.tipo_cliente = tipoCliente;

      const res = await getFacturas(params);
      setFacturas(res.data || []);
      setTotalPages(res.total_paginas || 1);
    } catch (error) {
      console.error("Error al obtener facturas", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ingresosTotales = todasFacturas.reduce(
    (acc: number, cur: Factura) => acc + Number(cur.total),
    0
  );

  const totalFacturasRango = todasFacturas.length;
  
  const subValueVentasDia = "Pedidos entregados hoy";

  // ============ CÁLCULOS PARA GRÁFICAS ============

  // 1. Tendencia de ventas por día
  const dataTendencia = (() => {
    const grupos: Record<
      string,
      { fecha: string; ventas: number; ingresos: number }
    > = {};
    todasFacturas.forEach((f) => {
      const fecha = dayjs(f.fecha_emision).format("YYYY-MM-DD");
      if (!grupos[fecha]) grupos[fecha] = { fecha, ventas: 0, ingresos: 0 };
      grupos[fecha].ventas += 1;
      grupos[fecha].ingresos += Number(f.total);
    });
    return Object.values(grupos).sort((a, b) => a.fecha.localeCompare(b.fecha));
  })();

  // 2. Top 5 productos más vendidos
  const dataTopProductos = (() => {
    const grupos: Record<
      string,
      { nombre: string; cantidad: number; ingresos: number }
    > = {};
    todasFacturas.forEach((f) => {
      f.factura_detalle?.forEach((d: any) => {
        const nombre = d.producto?.nombre || "Sin nombre";
        if (!grupos[nombre])
          grupos[nombre] = { nombre, cantidad: 0, ingresos: 0 };
        grupos[nombre].cantidad += Number(d.cantidad);
        grupos[nombre].ingresos += Number(d.total);
      });
    });
    return Object.values(grupos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  })();

  // 3. Clientes más frecuentes (Top 5)

  // 4. Ventas e ingresos por sucursal
  const dataSucursales = (() => {
    const grupos: Record<string, { sucursal: string; ingresos: number; ventas: number }> = {};
    todasFacturas.forEach((f) => {
      const suc = f.sucursal || "Sin sucursal";
      if (!grupos[suc]) grupos[suc] = { sucursal: suc, ingresos: 0, ventas: 0 };
      grupos[suc].ingresos += Number(f.total);
      grupos[suc].ventas += 1;
    });
    return Object.values(grupos).sort((a, b) => b.ingresos - a.ingresos);
  })();

  // 5. Ventas por marca
  const dataMarcas = (() => {
    const grupos: Record<string, { marca: string; cantidad: number; ingresos: number }> = {};
    todasFacturas.forEach((f) => {
      f.factura_detalle?.forEach((d: any) => {
        const marca = (typeof d.producto?.marca === "object" ? d.producto?.marca?.nombre : d.producto?.marca) || "Otras";
        if (!grupos[marca]) grupos[marca] = { marca, cantidad: 0, ingresos: 0 };
        grupos[marca].cantidad += Number(d.cantidad);
        grupos[marca].ingresos += Number(d.total);
      });
    });
    return Object.values(grupos).sort((a, b) => b.cantidad - a.cantidad);
  })();

  // ============ EXPORTAR PDF ============
  const handleExportPDF = async () => {
    try {
      const params: FiltroFacturasParams = { page: 1, limit: 5000 };
      if (fechaInicio) params.fecha_inicio = fechaInicio.format("YYYY-MM-DD");
      if (fechaFin) params.fecha_fin = fechaFin.format("YYYY-MM-DD");
      if (metodoPago && metodoPago !== "todos") params.metodo_pago = metodoPago;

      const res = await getFacturas(params);
      const facturasExport = res.data || [];

      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [2, 126, 177];

      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Reporte General de Ventas", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(74, 74, 74);
      doc.text(`Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 30);
      if (fechaInicio)
        doc.text(
          `Periodo: ${fechaInicio.format("DD/MM/YYYY")} - ${fechaFin?.format(
            "DD/MM/YYYY"
          )}`,
          14,
          36
        );

      const totalRevenue = facturasExport.reduce(
        (acc, cur) => acc + Number(cur.total),
        0
      );
      doc.text(`Total de Ventas: ${facturasExport.length}`, 14, 42);
      doc.text(
        `Ingresos Totales (Monto): L ${totalRevenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}`,
        14,
        48
      );

      autoTable(doc, {
        head: [["Nº Pedido", "Cliente", "Fecha", "Método", "Total"]],
        body: facturasExport.map((f: Factura) => [
          f.numero_factura,
          f.cliente?.nombre || "—",
          dayjs(f.fecha_emision).format("DD/MM/YYYY"),
          getMetodoPagoLabel(f.tipo_de_pago),
          `L ${Number(f.total).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`,
        ]),
        startY: 56,
        headStyles: { fillColor: primaryColor },
      });

      doc.save(`reporte_ventas_${dayjs().format("YYYYMMDD")}.pdf`);
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
    }
  };

  // ============ EXPORTAR EXCEL ============
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const primaryHex = "FF003E7B";

      // Hoja 1: Listado de Ventas
      const sheet1 = workbook.addWorksheet("Listado de Ventas", {
        views: [
          { showGridLines: false, state: "frozen", xSplit: 1, ySplit: 2 },
        ],
      });
      sheet1.getColumn("A").width = 3;
      const header1 = sheet1.getRow(2);
      header1.height = 25;
      const cols1 = [
        { header: "Nº Pedido", key: "numero", width: 25 },
        { header: "Cliente", key: "cliente", width: 30 },
        { header: "Correo", key: "correo", width: 30 },
        { header: "Teléfono", key: "telefono", width: 15 },
        { header: "Fecha", key: "fecha", width: 20 },
        { header: "Método de Pago", key: "metodo", width: 20 },
        { header: "Sucursal", key: "sucursal", width: 20 },
        { header: "Repartidor", key: "repartidor", width: 25 },
        { header: "Subtotal", key: "subtotal", width: 15 },
        { header: "Descuento", key: "descuento", width: 15 },
        { header: "IVA", key: "iva", width: 15 },
        { header: "Total", key: "total", width: 15 },
      ];
      cols1.forEach((col, idx) => {
        sheet1.getColumn(idx + 2).width = col.width;
        const cell = header1.getCell(idx + 2);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: primaryHex },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      todasFacturas.forEach((f, i) => {
        const row = sheet1.getRow(i + 3);
        row.getCell(2).value = f.numero_factura;
        row.getCell(3).value = f.cliente?.nombre || "—";
        row.getCell(4).value = f.cliente?.correo || "—";
        row.getCell(5).value = f.cliente?.telefono || "—";
        row.getCell(6).value = dayjs(f.fecha_emision).format(
          "DD/MM/YYYY HH:mm"
        );
        row.getCell(7).value = getMetodoPagoLabel(f.tipo_de_pago);
        row.getCell(8).value = f.sucursal || "—";
        row.getCell(9).value = f.repartidor || "—";
        row.getCell(10).value = Number(f.subtotal);
        row.getCell(10).numFmt = '"L "#,##0.00';
        row.getCell(11).value = Number(f.descuento);
        row.getCell(11).numFmt = '"L "#,##0.00';
        row.getCell(12).value = Number(f.iva);
        row.getCell(12).numFmt = '"L "#,##0.00';
        row.getCell(13).value = Number(f.total);
        row.getCell(13).numFmt = '"L "#,##0.00';
      });

      // Hoja 2: Tendencia
      const sheet2 = workbook.addWorksheet("Tendencia por Día", {
        views: [
          { showGridLines: false, state: "frozen", xSplit: 1, ySplit: 2 },
        ],
      });
      sheet2.getColumn("A").width = 3;
      const header2 = sheet2.getRow(2);
      header2.height = 25;
      ["Fecha", "Ventas", "Ingresos (L)"].forEach((h, idx) => {
        sheet2.getColumn(idx + 2).width = 20;
        const cell = header2.getCell(idx + 2);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: primaryHex },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      dataTendencia.forEach((d, i) => {
        const row = sheet2.getRow(i + 3);
        row.getCell(2).value = dayjs(d.fecha).format("DD/MM/YYYY");
        row.getCell(3).value = d.ventas;
        row.getCell(4).value = d.ingresos;
        row.getCell(4).numFmt = '"L "#,##0.00';
      });

      // Hoja 3: Top Productos
      const sheet3 = workbook.addWorksheet("Top Productos", {
        views: [
          { showGridLines: false, state: "frozen", xSplit: 1, ySplit: 2 },
        ],
      });
      sheet3.getColumn("A").width = 3;
      const header3 = sheet3.getRow(2);
      header3.height = 25;
      ["Producto", "Cantidad Vendida", "Ingresos (L)"].forEach((h, idx) => {
        sheet3.getColumn(idx + 2).width = idx === 0 ? 40 : 20;
        const cell = header3.getCell(idx + 2);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: primaryHex },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      dataTopProductos.forEach((d, i) => {
        const row = sheet3.getRow(i + 3);
        row.getCell(2).value = d.nombre;
        row.getCell(3).value = d.cantidad;
        row.getCell(4).value = d.ingresos;
        row.getCell(4).numFmt = '"L "#,##0.00';
      });

      // Hoja 4: Ventas por Sucursal
      const sheet4 = workbook.addWorksheet("Ventas por Sucursal", {
        views: [
          { showGridLines: false, state: "frozen", xSplit: 1, ySplit: 2 },
        ],
      });
      sheet4.getColumn("A").width = 3;
      const header4 = sheet4.getRow(2);
      header4.height = 25;
      ["Sucursal", "Ventas (pedidos)", "Ingresos (L)"].forEach((h, idx) => {
        sheet4.getColumn(idx + 2).width = 25;
        const cell = header4.getCell(idx + 2);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: primaryHex },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      dataSucursales.forEach((d, i) => {
        const row = sheet4.getRow(i + 3);
        row.getCell(2).value = d.sucursal;
        row.getCell(3).value = d.ventas;
        row.getCell(4).value = d.ingresos;
        row.getCell(4).numFmt = '"L "#,##0.00';
      });

      // Hoja 5: Ventas por Marca
      const sheet5 = workbook.addWorksheet("Ventas por Marca", {
        views: [
          { showGridLines: false, state: "frozen", xSplit: 1, ySplit: 2 },
        ],
      });
      sheet5.getColumn("A").width = 3;
      const header5 = sheet5.getRow(2);
      header5.height = 25;
      ["Marca", "Cantidad Vendida", "Ingresos (L)"].forEach((h, idx) => {
        sheet5.getColumn(idx + 2).width = 25;
        const cell = header5.getCell(idx + 2);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: primaryHex },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      dataMarcas.forEach((d, i) => {
        const row = sheet5.getRow(i + 3);
        row.getCell(2).value = d.marca;
        row.getCell(3).value = d.cantidad;
        row.getCell(4).value = d.ingresos;
        row.getCell(4).numFmt = '"L "#,##0.00';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `reporte_ventas_${dayjs().format("YYYYMMDD")}.xlsx`
      );
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    }
  };

  const handleClearFilters = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setMetodoPago("");
    setMarca("");
    setSucursal("");
    setTipoCliente("");
    setCurrentPage(1);
  };

  const handlePreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const getMetodoPagoLabel = (metodo: string) => {
    const metodos: Record<string, string> = {
      efectivo: "Efectivo",
      transferencia_bancaria: "Transferencia",
      pos: "POS",
      compra_click: "Compra Click",
      pay_pal: "PayPal",
    };
    return metodos[metodo] || metodo;
  };

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo) {
      case "efectivo":
        return "bg-[#d1fae5] text-[#10b981] border border-[#10b981]";
      case "pay_pal":
        return "bg-[#dbeafe] text-[#3b82f6] border border-[#3b82f6]";
      case "transferencia_bancaria":
        return "bg-[#e0e7ff] text-[#6366f1] border border-[#6366f1]";
      default:
        return "bg-[#fef3c7] text-[#f59e0b] border border-[#f59e0b]";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-1">
                Reporte de Ventas
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#6b7280]">
                Revisa y gestiona las ventas realizadas
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleExportExcel}
                className="h-10 sm:h-11 px-4 sm:px-6 bg-[#10B981] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#059669] transition-all font-semibold shadow-sm text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Excel</span>
                <span className="sm:hidden">XLSX</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="h-10 sm:h-11 px-4 sm:px-6 bg-[#DC2626] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#B91C1C] transition-all font-semibold shadow-sm text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Reporte (PDF)</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-3 sm:p-6 mb-5 sm:mb-8">
            <FilterBar
              filters={[
                {
                  placeholder: "Método de Pago",
                  value: metodoPago || undefined,
                  onChange: (v) => {
                    setMetodoPago(v ? String(v) : "");
                    setCurrentPage(1);
                  },
                  className: "lg:flex-[1]",
                  options: [
                    { label: "Todos", value: "todos" },
                    { label: "Efectivo", value: "efectivo" },
                    { label: "Transferencia", value: "transferencia_bancaria" },
                    { label: "POS", value: "pos" },
                    { label: "Compra Click", value: "compra_click" },
                    { label: "PayPal", value: "pay_pal" },
                  ],
                },
                {
                  placeholder: "Marca",
                  value: marca || undefined,
                  onChange: (v) => {
                    setMarca(v ? String(v) : "");
                    setCurrentPage(1);
                  },
                  className: "lg:flex-[1]",
                  options: [
                    { label: "Todas las marcas", value: "todas" },
                    { label: "Bridgestone", value: "Bridgestone" },
                    { label: "Michelin", value: "Michelin" },
                    { label: "Continental", value: "Continental" },
                    { label: "BF Goodrich", value: "BF Goodrich" },
                    { label: "Goodyear", value: "Goodyear" },
                  ],
                },
                {
                  placeholder: "Sucursal",
                  value: sucursal || undefined,
                  onChange: (v) => {
                    setSucursal(v ? String(v) : "");
                    setCurrentPage(1);
                  },
                  className: "lg:flex-[1]",
                  options: [
                    { label: "Todas", value: "todas" },
                    { label: "Tegucigalpa", value: "Tegucigalpa" },
                    { label: "San Pedro Sula", value: "San Pedro Sula" },
                    { label: "La Ceiba", value: "La Ceiba" },
                  ],
                },
                {
                  placeholder: "Tipo de Cliente",
                  value: tipoCliente || undefined,
                  onChange: (v) => {
                    setTipoCliente(v ? String(v) : "");
                    setCurrentPage(1);
                  },
                  className: "lg:flex-[1]",
                  options: [
                    { label: "Todos", value: "todos" },
                    { label: "Registrado", value: "registrado" },
                    { label: "Invitado", value: "invitado" },
                  ],
                },
              ]}
              fechaInicio={{
                value: fechaInicio,
                onChange: (date) => {
                  setFechaInicio(date);
                  setCurrentPage(1);
                },
                placeholder: "Desde",
                className: "lg:flex-[1.5]",
              }}
              fechaFin={{
                value: fechaFin,
                onChange: (date) => {
                  setFechaFin(date);
                  setCurrentPage(1);
                },
                placeholder: "Hasta",
                className: "lg:flex-[1.5]",
              }}
              onClear={handleClearFilters}
            />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-5 sm:mb-8">
            <KpiCard
              title="Ventas Totales"
              value={totalFacturasRango}
              subValue="Total histórico"
              icon={
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#027EB1]" />
              }
              onClick={() => {
                const element = document.getElementById("listado-ventas");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />
            <KpiCard
              title="Ventas del Día"
              value={ventasHoy}
              subValue={subValueVentasDia}
              icon={
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#10B981]" />
              }
              onClick={() => {
                const hoy = dayjs();
                setFechaInicio(hoy);
                setFechaFin(hoy);
                setCurrentPage(1);
                setTimeout(() => {
                  const element = document.getElementById("listado-ventas");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }}
            />
            <KpiCard
              title="Ingresos Totales"
              value={`L ${ingresosTotales.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`}
              subValue="Suma total de ventas"
              isText={true}
              icon={
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B]" />
              }
            />
          </div>

          {/* ============ GRÁFICAS ============ */}

          {/* Tendencia + Ventas por Sucursal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-8">

            {/* Tendencia dual-eje */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
              <h3 className="text-base sm:text-[0.9rem] font-bold text-[#003E7B] mb-4">
                Tendencia de Ventas e Ingresos por Día
              </h3>
              <div className="h-[220px] sm:h-[260px] flex items-center justify-center">
                {dataTendencia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={dataTendencia}
                      margin={{ top: 10, right: 65, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#027EB1" stopOpacity={0.13} />
                          <stop offset="95%" stopColor="#027EB1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(v: any) => dayjs(v).format("DD/MM")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#027EB1", fontSize: 10 }}
                        width={28}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#10B981", fontSize: 10 }}
                        width={62}
                        tickFormatter={(v: any) =>
                          `L ${(Number(v) / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                          background: "rgba(15,23,42,0.92)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}
                        itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                        labelFormatter={(v: any) => dayjs(v).format("DD MMM, YYYY")}
                        formatter={(value: any, name: string) =>
                          name === "Ingresos (L)"
                            ? [`L ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, name]
                            : [value, name]
                        }
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px", color: "#64748b", paddingTop: 8 }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="ventas"
                        name="Ventas (pedidos)"
                        stroke="#027EB1"
                        strokeWidth={2.5}
                        fill="url(#gradVentas)"
                        dot={{ r: 4, fill: "#027EB1", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="ingresos"
                        name="Ingresos (L)"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        strokeDasharray="5 3"
                        fill="url(#gradIngresos)"
                        dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos para mostrar</p>
                )}
              </div>
            </div>

            {/* Ventas por Sucursal */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
              <h3 className="text-base sm:text-[0.9rem] font-bold text-[#003E7B] mb-4">
                Ventas por Sucursal (L)
              </h3>
              <div className="h-[220px] sm:h-[260px] flex items-center justify-center">
                {dataSucursales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dataSucursales}
                      margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="sucursal"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={45}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                        width={52}
                        tickFormatter={(v: any) =>
                          `L ${(Number(v) / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(2,126,177,0.05)" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                          background: "rgba(15,23,42,0.92)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}
                        itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                        formatter={(value: any) => [
                          `L ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                          "Ingresos",
                        ]}
                      />
                      <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} barSize={36}>
                        {dataSucursales.map((_, i) => (
                          <Cell
                            key={i}
                            fill={[
                              "rgba(2,126,177,0.85)",
                              "rgba(16,185,129,0.85)",
                              "rgba(245,158,11,0.85)",
                              "rgba(139,92,246,0.85)",
                            ][i % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos para mostrar</p>
                )}
              </div>
            </div>

          </div>

          {/* Top 5 Productos + Ventas por Marca */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-8">

            {/* Top 5 productos más vendidos — estilo prototipo */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
              <h3 className="text-[0.9rem] font-bold text-[#003E7B] mb-4">
                Top 5 Productos Más Vendidos
              </h3>
              <div className="h-[260px] flex items-center justify-center">
                {dataTopProductos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dataTopProductos}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="nombre"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={170}
                        tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
                        tickFormatter={(name: string) =>
                          name.length > 25 ? name.substring(0, 22) + "..." : name
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(2,126,177,0.05)" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                          background: "rgba(15,23,42,0.92)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}
                        itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                        formatter={(value: any) => [`${value} unidades`, "Cantidad"]}
                      />
                      <Bar
                        dataKey="cantidad"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        {dataTopProductos.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`${COLORS[i % COLORS.length]}CC`}
                          />
                        ))}
                        <LabelList
                          dataKey="cantidad"
                          position="right"
                          offset={10}
                          style={{ fill: "#475569", fontSize: 12, fontWeight: "bold" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos para mostrar</p>
                )}
              </div>
            </div>

            {/* Ventas por Marca — pie */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 sm:p-6">
              <h3 className="text-[0.9rem] font-bold text-[#003E7B] mb-4">
                Ventas por Marca
              </h3>
              <div className="h-[260px] flex items-center justify-center">
                {dataMarcas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataMarcas}
                        dataKey="cantidad"
                        nameKey="marca"
                        cx="50%"
                        cy="45%"
                        outerRadius={90}
                        innerRadius={0}
                        paddingAngle={2}
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {dataMarcas.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                          background: "rgba(15,23,42,0.92)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                        formatter={(value: any, name: any) => [
                          `${value} uds`,
                          name,
                        ]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: 10 }}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos para mostrar</p>
                )}
              </div>
            </div>

          </div>

          {/* Tabla / Cards de Ventas */}
          <div
            id="listado-ventas"
            className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] overflow-hidden mb-8"
          >
            <div className="p-4 sm:p-6 bg-[#003E7B] text-white">
              <h3 className="text-base sm:text-lg font-bold">
                Listado de Ventas
              </h3>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 space-y-4">
                <RefreshCcw className="w-8 h-8 sm:w-10 sm:h-10 text-[#027EB1] animate-spin" />
                <p className="text-gray-500 font-medium text-sm">
                  Cargando Ventas...
                </p>
              </div>
            ) : (
              <>
                {/* DESKTOP: Tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f8fafc] border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                          Nº Pedido
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                          Cliente
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                          Método Pago
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                          Sucursal
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                          Subtotal
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                          Descuento
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                          IVA
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                          Repartidor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {facturas.map((factura) => (
                        <tr
                          key={factura.id_factura}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setModalVenta(factura)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#1a1a1a]">
                              {factura.numero_factura}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {factura.id_factura}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-bold text-[#1a1a1a]">
                                  {factura.cliente?.nombre || "Sin nombre"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {factura.cliente?.correo || "Sin correo"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#9ca3af]" />
                              <span className="text-[14px] text-[#4a4a4a]">
                                {dayjs(factura.fecha_emision).format(
                                  "DD/MM/YYYY"
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-bold ${getMetodoPagoColor(
                                factura.tipo_de_pago
                              )}`}
                            >
                              {getMetodoPagoLabel(factura.tipo_de_pago)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-500 font-medium">
                            {factura.sucursal || "—"}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500 font-medium">
                            <span className="whitespace-nowrap">{`L ${Number(factura.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-red-500 font-medium">
                            <span className="whitespace-nowrap">{`- L ${Number(factura.descuento || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500 font-medium">
                            <span className="whitespace-nowrap">{`L ${Number(factura.iva || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="whitespace-nowrap font-bold text-[#1a1a1a]">{`L ${Number(factura.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</span>
                          </td>
                          <td className="px-6 py-4 text-left text-gray-500 font-medium">
                            {factura.repartidor || "—"}
                          </td>
                        </tr>
                      ))}
                      {facturas.length === 0 && (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-6 py-12 text-center text-gray-400 font-medium"
                          >
                            No se encontraron ventas en este periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MÓVIL: Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {facturas.length === 0 && (
                    <div className="px-4 py-12 text-center text-gray-400 font-medium text-sm">
                      No se encontraron ventas en este periodo.
                    </div>
                  )}
                  {facturas.map((factura) => (
                    <div
                      key={factura.id_factura}
                      className="bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-sm cursor-pointer active:bg-gray-50"
                      onClick={() => setModalVenta(factura)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Cliente
                          </div>
                          <div className="font-bold text-[#1a1a1a] text-sm mt-0.5 truncate max-w-[200px]">
                            {factura.cliente?.nombre || "Sin nombre"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {factura.cliente?.correo || "Sin correo"}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold ${getMetodoPagoColor(
                            factura.tipo_de_pago
                          )}`}
                        >
                          {getMetodoPagoLabel(factura.tipo_de_pago)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-600">Venta:</span>
                        <span className="text-xs text-gray-800">{factura.numero_factura}</span>
                        <span className="text-xs text-gray-400 ml-2">ID: {factura.id_factura}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {dayjs(factura.fecha_emision).format(
                            "DD/MM/YYYY, HH:mm"
                          )}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-sm text-gray-500">Sucursal</span>
                          <span className="text-sm text-gray-700 font-medium">
                            {factura.sucursal || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Subtotal
                          </span>
                          <span className="text-sm text-gray-700 font-medium">
                            L{" "}
                            {Number(factura.subtotal).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total</span>
                          <span className="text-base font-bold text-[#1a1a1a]">
                            L{" "}
                            {Number(factura.total).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 border-t border-[#e5e7eb] bg-[#f9fafb] gap-2">
                    <button
                      className="px-3 sm:px-4 py-2 text-xs sm:text-[14px] text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 border border-[#e5e7eb] rounded-lg bg-white hover:bg-gray-50"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <div className="text-xs sm:text-[14px] font-medium text-gray-600 text-center">
                      <span className="hidden sm:inline">Página </span>
                      <span className="font-bold text-gray-900">
                        {currentPage}
                      </span>{" "}
                      de{" "}
                      <span className="font-bold text-gray-900">
                        {totalPages}
                      </span>
                    </div>
                    <button
                      className="px-3 sm:px-4 py-2 text-xs sm:text-[14px] text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 border border-[#e5e7eb] rounded-lg bg-white hover:bg-gray-50"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle del cliente */}
      {modalVenta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setModalVenta(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 bg-[#003E7B] text-white shrink-0">
              <div>
                <p className="text-xs font-medium opacity-70 uppercase tracking-wider">
                  Detalle de Venta
                </p>
                <h3 className="text-lg font-bold mt-0.5">
                  {modalVenta.numero_factura}
                </h3>
              </div>
              <button
                onClick={() => setModalVenta(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Cliente
                </p>
                {modalVenta.cliente && modalVenta.cliente.nombre ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#027EB1]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Nombre</p>
                        <p className="text-sm font-bold text-[#1a1a1a]">
                          {modalVenta.cliente.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-[#027EB1]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Correo</p>
                        <p className="text-sm font-medium text-[#1a1a1a] break-all">
                          {modalVenta.cliente.correo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-[#027EB1]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {modalVenta.cliente.telefono || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Sin información del cliente
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {modalVenta.factura_detalle &&
                modalVenta.factura_detalle.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Productos
                    </p>
                    <div className="space-y-2">
                      {modalVenta.factura_detalle.map((d: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Package className="w-4 h-4 text-[#027EB1] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1a1a1a] truncate">
                                {d.producto?.nombre}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                x{d.cantidad}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#1a1a1a] shrink-0">
                            L{" "}
                            {Number(d.total).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="border-t border-gray-100" />

              {modalVenta.repartidor && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Entregado por
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-[#027EB1]" />
                    </div>
                    <p className="text-sm font-bold text-[#1a1a1a]">
                      {modalVenta.repartidor}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 shrink-0 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>
                  L{" "}
                  {Number(modalVenta.subtotal).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1a1a1a]">
                <span>Total</span>
                <span>
                  L{" "}
                  {Number(modalVenta.total).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ title, value, subValue, icon, isText = false, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#e5e7eb] p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex-1 min-w-0 pr-3 sm:pr-4">
          <p className="text-xs sm:text-sm text-gray-500 font-medium truncate mb-1 sm:mb-2">
            {title}
          </p>
          <div
            className={`font-bold text-gray-900 leading-tight truncate ${
              isText ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {value}
          </div>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <p className="text-xs sm:text-sm truncate text-gray-500">{subValue}</p>
      </div>
    </div>
  );
}
