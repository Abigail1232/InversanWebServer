import { useEffect, useState } from "react";
import { Button, DatePicker, Input, Pagination, Select, Tooltip } from "antd";
import {
  Calendar,
  Eye,
  Filter,
  FilterX,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { getEntries } from "../../api/admin/entries";
import DetalleIngresoModal from "../../components/modal/entryDetail";
import { getWarehouses } from "../../api/admin/store";

interface Warehouse {
  id_bodega: number;
  nombre: string;
  sucursal: {
    nombre: string;
  };
}

export interface IngresoProducto {
  id_entry: string;
  date: string;
  store: string;
  supplier: string;
  user: string;
  productos_count: number;
  unidades_count: number;
}

export default function HistorialIngreso() {
  const [showFilters, setShowFilters] = useState(false);
  const [entries, setEntries] = useState<IngresoProducto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filterId, setFilterId] = useState<number | null>(null);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const [wareHouses, setWareHouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | "Todas">(
    "Todas",
  );

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [selectedEntry, setSelectedEntry] = useState<IngresoProducto | null>(
    null,
  );

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const resetFilters = () => {
    setFilterId(null);
    setFilterProvider("");
    setFilterUser("");
    setSelectedWarehouse("Todas");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      setWareHouses(data?.data || []);
    } catch (error) {
      console.error("Error cargando bodegas:", error);
      setWareHouses([]);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);

      const data = await getEntries(
        filterId,
        filterProvider,
        filterUser,
        selectedWarehouse,
        startDate?.format("YYYY-MM-DD"),
        endDate?.format("YYYY-MM-DD"),
        page,
        pageSize,
      );

      setEntries(data?.data || []);
      setTotal(data?.pagination?.total || data?.data?.length || 0);
    } catch (error) {
      console.error("Error cargando ingresos:", error);
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [
    filterId,
    filterProvider,
    filterUser,
    selectedWarehouse,
    startDate,
    endDate,
    page,
  ]);

  const columns: DataTableColumn<IngresoProducto>[] = [
    {
      title: "ID",
      dataIndex: "id_entry",
      key: "id_entry",
      width: 80,
    },
    {
      title: "Fecha",
      dataIndex: "date",
      key: "date",
      render: (fecha) => dayjs(String(fecha)).format("DD-MM-YYYY"),
    },
    {
      title: "Bodega",
      dataIndex: "store",
      key: "store",
    },
    {
      title: "Proveedor",
      dataIndex: "supplier",
      key: "supplier",
    },
    {
      title: "Productos",
      dataIndex: "productos_count",
      key: "productos_count",
    },
    {
      title: "Unidades",
      dataIndex: "unidades_count",
      key: "unidades_count",
      render: (unidades) => {
        const val = Number(unidades);
        return (
          <span className={`font-bold ${val < 0 ? 'text-red-600' : val > 0 ? 'text-green-600' : 'text-slate-600'}`}>
            {val > 0 ? '+' : ''}{val.toLocaleString()}
          </span>
        );
      }
    },
    {
      title: "Responsable",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div className="flex justify-center">
          <Tooltip title="Ver detalle">
            <button
              type="button"
              onClick={() => setSelectedEntry(record)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#027EB1] hover:bg-[#EAF6FB] transition-colors"
            >
              <Eye className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#F5F7FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-5 md:py-6">
        <div className="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
              Historial de Movimientos de Inventario
            </h1>

            <div className="text-sm text-slate-500 mt-1">
              Historial, seguimiento y trazabilidad del inventario.
            </div>
          </div>

          <Button
            type="primary"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters((value) => !value)}
            className="!h-10 !rounded-xl !border-none !bg-[#027EB1] hover:!bg-[#026a96] !shadow-none !text-base !font-semibold px-5"
          >
            {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-grow min-w-[180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027EB1] pointer-events-none" />
                  <Input
                    value={filterId ?? ""}
                    onChange={(e) => {
                      setFilterId(e.target.value ? Number(e.target.value) : null);
                      setPage(1);
                    }}
                    placeholder="ID de ingreso"
                    className="!h-10 !w-full !rounded-xl !bg-white !border !border-[#D7E3F0] hover:!border-[#027EB1] focus:!border-[#027EB1] !pl-9 !text-slate-700 placeholder:!text-slate-400"
                  />
                </div>
              </div>

              <div className="flex-grow min-w-[220px]">
                <div className="relative">
                  <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027EB1] pointer-events-none z-10" />
                  <Input
                    value={filterProvider}
                    onChange={(e) => {
                      setFilterProvider(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar proveedor..."
                    className="!h-10 !w-full !rounded-xl !bg-white !border !border-[#D7E3F0] hover:!border-[#027EB1] focus:!border-[#027EB1] !pl-9 !text-slate-700 placeholder:!text-slate-400"
                  />
                </div>
              </div>

              <div className="flex-grow min-w-[220px]">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027EB1] pointer-events-none z-10" />
                  <Input
                    value={filterUser}
                    onChange={(e) => {
                      setFilterUser(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar responsable..."
                    className="!h-10 !w-full !rounded-xl !bg-white !border !border-[#D7E3F0] hover:!border-[#027EB1] focus:!border-[#027EB1] !pl-9 !text-slate-700 placeholder:!text-slate-400"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 min-w-[160px]">
                <DatePicker
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setPage(1);
                  }}
                  placeholder="Fecha Inicio"
                  format="DD-MM-YYYY"
                  suffixIcon={<Calendar className="h-4 w-4 text-[#027EB1]" />}
                  className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1]"
                />
              </div>

              <div className="flex-shrink-0 min-w-[160px]">
                <DatePicker
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setPage(1);
                  }}
                  placeholder="Fecha Final"
                  format="DD-MM-YYYY"
                  suffixIcon={<Calendar className="h-4 w-4 text-[#027EB1]" />}
                  className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1]"
                />
              </div>

              <div className="flex-grow min-w-[230px]">
                <Select
                  value={selectedWarehouse}
                  onChange={(value) => {
                    setSelectedWarehouse(value);
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-xl"
                  placeholder="Seleccionar bodega"
                >
                  <Select.Option value="Todas">Todas las bodegas</Select.Option>

                  {wareHouses.map((warehouse) => (
                    <Select.Option
                      key={warehouse.id_bodega}
                      value={warehouse.id_bodega}
                    >
                      {warehouse.nombre} - {warehouse.sucursal?.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                title="Limpiar filtros"
                className="flex items-center justify-center h-10 min-w-[40px] rounded-xl border border-[#D7E3F0] bg-white text-slate-600 hover:text-[#D61216] hover:border-[#D61216] transition-all group flex-shrink-0"
              >
                <FilterX className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}

        <div className="hidden md:block">
          <DataTable
            rowKey="id_entry"
            columns={columns}
            dataSource={entries}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (newPage) => setPage(newPage),
            }}
            emptyMessage="No hay ingresos registrados"
          />
        </div>

        <div className="md:hidden mt-5 flex flex-col gap-3">
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center text-sm text-slate-500">
              Cargando ingresos...
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center text-sm text-slate-500">
              No hay ingresos registrados
            </div>
          )}

          {!loading &&
            entries.map((entry) => (
              <div
                key={entry.id_entry}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">
                      {entry.supplier}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      ID: {entry.id_entry}
                    </div>
                  </div>

                  <Tooltip title="Ver detalle">
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#027EB1] hover:bg-[#EAF6FB] transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </Tooltip>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-500">Fecha</div>
                  <div className="text-slate-700 text-right">
                    {dayjs(String(entry.date)).format("DD-MM-YYYY")}
                  </div>

                  <div className="text-slate-500">Bodega</div>
                  <div className="text-slate-700 text-right">{entry.store}</div>

                  <div className="text-slate-500">Productos</div>
                  <div className="text-slate-700 text-right">
                    {entry.productos_count}
                  </div>

                  <div className="text-slate-500">Unidades</div>
                  <div className={`text-right font-bold ${Number(entry.unidades_count) < 0 ? 'text-red-600' : Number(entry.unidades_count) > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                    {Number(entry.unidades_count) > 0 ? '+' : ''}{Number(entry.unidades_count).toLocaleString()}
                  </div>

                  <div className="text-slate-500">Responsable</div>
                  <div className="text-slate-700 text-right">{entry.user}</div>
                </div>
              </div>
            ))}

          {total > pageSize && (
            <div className="flex justify-center mt-4 pt-2">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(newPage) => setPage(newPage)}
                showSizeChanger={false}
                showQuickJumper={false}
                simple
              />
            </div>
          )}
        </div>
      </div>

      <DetalleIngresoModal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  );
}