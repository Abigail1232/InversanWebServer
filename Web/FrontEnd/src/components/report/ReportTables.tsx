import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Layers, ChevronDown, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { TopProductoData, SinVistasData } from '../../api/reportes/reportes';
import { useTableFilters } from '../../hooks/useTableFilters';
import { getSinVistas, getOportunidades, getTopProductos } from '../../api/reportes/reportes';
import ProductViewModal from '../modal/ProductViewModal';
import api from '../../api/axios';
import { DatePicker, ConfigProvider } from 'antd';
import esES from 'antd/lib/locale/es_ES';
import dayjs from 'dayjs';

// --- CONFIGURACIÓN CENTRALIZADA ---
export const SPEC_CONFIGS = [
  { key: 'id_marca', label: 'Marca', type: 'select', apiField: 'marcas' },
  { key: 'id_categoria', label: 'Categoría', type: 'select', apiField: 'categorias' },
  { key: 'rin', label: 'Rin / Pulgada', type: 'select', apiField: 'rines' },
  { key: 'ancho_rin', label: 'Ancho', type: 'select', apiField: 'anchos_rin' },
  { key: 'alto_rin', label: 'Perfil', type: 'select', apiField: 'altos_rin' },
  { key: 'lonas', label: 'Lonas', type: 'select', apiField: 'lonas' }
];

// --- ESTILOS COMPARTIDOS (UI Consistency) ---
const HEADER_CLASS = "py-3 px-6 text-white flex flex-col xl:flex-row xl:items-center justify-between gap-3";
const SCROLLBAR_CLASS = "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:transition-colors";
const INPUT_CLASS = `h-10 w-full rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:ring-1 focus:ring-[#027EB1] focus:outline-none px-3 py-0 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 appearance-none ${SCROLLBAR_CLASS}`;
const LABEL_CLASS = "block mb-1 text-[11px] font-bold text-gray-700 tracking-tight uppercase opacity-80";

export function DynamicTableFilter({
  configs,
  filters,
  updateFilter,
  mainFilter
}: {
  configs: typeof SPEC_CONFIGS;
  filters: Record<string, any>;
  updateFilter: (k: string, v: any) => void;
  mainFilter?: {
    key?: string;
    keys?: [string, string];
    label: string;
    type?: 'select' | 'number' | 'range';
    options?: { label: string; value: number }[];
    unit?: string;
  }
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [options, setOptions] = useState<any>({});

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [rinesRes, marcasRes, categoriasRes] = await Promise.all([
          import('../../api/products/rines').then(m => m.getFiltrosLlantas()),
          import('../../api/products/marcas').then(m => m.getMarcas()),
          import('../../api/products/categorias').then(m => m.getCategorias())
        ]);

        const newOptions: any = {};
        if (rinesRes.success && rinesRes.filtros) {
          Object.keys(rinesRes.filtros).forEach(key => {
            const val = rinesRes.filtros[key as keyof typeof rinesRes.filtros];
            newOptions[key] = Array.isArray(val) ? Array.from(new Set(val)) : val;
          });
          newOptions.lonas = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
        }
        newOptions.marcas = marcasRes.map(m => ({ label: m.nombre, value: m.id_marca }));
        newOptions.categorias = categoriasRes.map(c => ({ label: c.nombre, value: c.id_categoria }));
        setOptions(newOptions);
      } catch (err) {
        console.error("Error cargando filtros:", err);
      }
    };
    loadOptions();
  }, []);

  return (
    <div className="bg-white border-b border-[#e5e7eb] transition-all duration-300 overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-[#003E7B] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          <span className="text-[10px] font-bold text-[#003E7B] uppercase tracking-wider">Filtros de especificaciones</span>
        </div>
        {!isOpen && <span className="text-[10px] text-slate-400 font-medium italic">Clic para expandir filtros</span>}
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 p-5' : 'max-h-0 opacity-0 p-0 pointer-events-none'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-6 items-start">
          {/* Columna Izquierda: Filtros de Control (Fechas + Principal) */}
          <div className="lg:col-span-3 border-r border-[#D7E3F0] pr-6 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Rango de Fecha</label>
              <ConfigProvider locale={esES}>
                <div className="flex items-center gap-2">
                  <DatePicker 
                    className="w-full h-10 rounded-xl bg-[#F8FAFC] border-[#D7E3F0]"
                    placeholder="Desde"
                    value={filters.fecha_inicio ? dayjs(filters.fecha_inicio) : null}
                    onChange={(date) => updateFilter('fecha_inicio', date ? date.format('YYYY-MM-DD') : undefined)}
                  />
                  <DatePicker 
                    className="w-full h-10 rounded-xl bg-[#F8FAFC] border-[#D7E3F0]"
                    placeholder="Hasta"
                    value={filters.fecha_fin ? dayjs(filters.fecha_fin) : null}
                    onChange={(date) => updateFilter('fecha_fin', date ? date.format('YYYY-MM-DD') : undefined)}
                  />
                </div>
              </ConfigProvider>
            </div>

            {mainFilter && (
              <div className="pt-2">
                <label className={LABEL_CLASS}>{mainFilter.label}</label>
                <div className="relative">
                  {mainFilter.type === 'number' && mainFilter.key ? (
                    <input
                      type="number"
                      min="1"
                      value={filters[mainFilter.key] || ''}
                      onChange={(e) => updateFilter(mainFilter.key!, e.target.value ? Number(e.target.value) : undefined)}
                      className={`${INPUT_CLASS} font-bold text-[#003E7B] bg-[#EAF7FD] border-[#027EB1] focus:border-[#003E7B]`}
                      placeholder="Escriba días..."
                    />
                  ) : mainFilter.type === 'range' && mainFilter.keys ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={filters[mainFilter.keys[0]] || ''}
                          onChange={(e) => updateFilter(mainFilter.keys![0], e.target.value ? Number(e.target.value) : undefined)}
                          className={`${INPUT_CLASS} font-bold text-[#003E7B] bg-[#EAF7FD] border-[#027EB1] focus:border-[#003E7B] pr-7`}
                          placeholder="Min"
                        />
                        {mainFilter.unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#027EB1]">{mainFilter.unit}</span>}
                      </div>
                      <span className="text-[#003E7B] font-bold opacity-20 text-xs">-</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={filters[mainFilter.keys[1]] || ''}
                          onChange={(e) => updateFilter(mainFilter.keys![1], e.target.value ? Number(e.target.value) : undefined)}
                          className={`${INPUT_CLASS} font-bold text-[#003E7B] bg-[#EAF7FD] border-[#027EB1] focus:border-[#003E7B] pr-7`}
                          placeholder="Max"
                        />
                        {mainFilter.unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#027EB1]">{mainFilter.unit}</span>}
                      </div>
                    </div>
                  ) : mainFilter.key ? (
                    <>
                      <select
                        value={filters[mainFilter.key] || ''}
                        onChange={(e) => updateFilter(mainFilter.key!, e.target.value ? Number(e.target.value) : undefined)}
                        className={`${INPUT_CLASS} font-bold text-[#003E7B] bg-[#EAF7FD] border-[#027EB1] focus:border-[#003E7B] pr-10`}
                      >
                        <option value="">Seleccionar...</option>
                        {mainFilter.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-[#027EB1]" />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Especificaciones del Producto */}
          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-4">
            {configs.map(conf => (
              <div key={conf.key}>
                <label className={LABEL_CLASS}>{conf.label}</label>
                {conf.type === 'select' ? (
                  <div className="relative">
                    <select
                      value={filters[conf.key] || ''}
                      onChange={(e) => updateFilter(conf.key, e.target.value ? (conf.type === 'select' ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : e.target.value) : undefined)}
                      className={`${INPUT_CLASS} pr-10`}
                    >
                      <option value="">Todos...</option>
                      {options[conf.apiField!]?.map((val: any) => {
                        const label = typeof val === 'object' ? val.label : val;
                        const value = typeof val === 'object' ? String(val.value) : val;
                        return <option key={String(value)} value={value}>{label}</option>;
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Todos..."
                    value={filters[conf.key] || ''}
                    onChange={(e) => updateFilter(conf.key, e.target.value)}
                    className={INPUT_CLASS}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'left' }: { label: string, sortKey: string, currentSort: { key: string, direction: 'asc' | 'desc' } | null, onSort: (key: string) => void, align?: 'left' | 'center' | 'right' }) {
  const isActive = currentSort?.key === sortKey;
  const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th 
      className={`px-4 py-2 text-xs font-bold ${alignmentClass} text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors group`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        <span>{label}</span>
        <div className="flex flex-col">
          {isActive ? (
            currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#027EB1]" /> : <ArrowDown className="w-3 h-3 text-[#027EB1]" />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400" />
          )}
        </div>
      </div>
    </th>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <>
      {/* Vista Desktop */}
      <div className="hidden md:flex h-[50px] items-center justify-between border-t border-[rgba(139,90,43,0.04)] bg-[rgba(139,90,43,0.03)] px-4">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Anterior
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                ? "bg-[#0B4E86] text-white"
                : "border border-[#d1d5dc] bg-white text-[#364153] hover:bg-gray-50"
                }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Siguiente
        </button>
      </div>

      {/* Vista Mobile */}
      <div className="md:hidden flex flex-col items-center justify-between gap-4 mt-2 mb-6 px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`shrink-0 min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                ? "bg-[#0B4E86] text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {page}
            </button>
          ))}
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white active:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white active:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
}

export const SinVistasTable = forwardRef(({ 
  initialData, 
  baseParams,
  rangeText
}: { 
  initialData: SinVistasData[], 
  baseParams: any,
  rangeText: string
}, ref) => {
  const [data, setData] = useState<SinVistasData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const { filters, debouncedFilters, updateFilter, clearFilters } = useTableFilters<Record<string, any>>({ 
    fecha_inicio: undefined,
    fecha_fin: undefined
  });

  useEffect(() => {
    if (baseParams.fecha_inicio) updateFilter('fecha_inicio', baseParams.fecha_inicio);
    if (baseParams.fecha_fin) updateFilter('fecha_fin', baseParams.fecha_fin);
  }, [baseParams.fecha_inicio, baseParams.fecha_fin]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useImperativeHandle(ref, () => ({
    expand: () => setIsCollapsed(false),
    applyFilter: (key: string, value: any) => {
      setIsCollapsed(false);
      updateFilter(key, value);
    },
    clearAll: () => clearFilters()
  }));

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handlePreview = async (id: number) => {
    setIsPreviewLoading(id);
    try {
      const response = await api.get(`/api/products/${id}`);
      const p = response.data.producto;
      setSelectedProduct({
        id: p.id_producto,
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        precio: p.precios?.detalle || 0,
        stock: p.stock_total || 0,
        descripcion: p.descripcion || "",
        imagenes: p.imagenes?.map((img: any) => ({ url: img.url, id: img.id })) || [],
        ancho: p.especificaciones?.ancho_rin?.toString() || "",
        perfil: p.especificaciones?.alto_rin?.toString() || "",
        rin: p.especificaciones?.rin?.toString() || "",
        lonas: p.especificaciones?.lonas?.toString() || "",
        profundidad: p.especificaciones?.profundidad?.toString() || "",
        presionMaxima: p.especificaciones?.presion_maxima?.toString() || "",
        indiceVelocidad: p.especificaciones?.indice_velocidad?.toString() || "",
        indiceCarga: p.especificaciones?.indice_de_carga?.toString() || "",
        modelo3D: p.imagen_3d ? { url: p.imagen_3d } : undefined
      });
    } catch (error) {
      console.error("Error fetching product preview", error);
    } finally {
      setIsPreviewLoading(null);
    }
  };

  useEffect(() => {
    // Only refetch if filter actually changes length or value
    let cancel = false;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const cleanFilters = Object.fromEntries(Object.entries(debouncedFilters).filter(([_, v]) => v !== undefined && v !== ''));
        const res = await getSinVistas({ ...baseParams, ...cleanFilters });
        if (!cancel) {
          setData(res);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Filter error", err);
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };
    fetchFiltered();
    return () => { cancel = true; };
  }, [debouncedFilters, baseParams]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const localRangeText = (filters.fecha_inicio && filters.fecha_fin)
    ? `${dayjs(filters.fecha_inicio).format('DD/MM/YYYY')} - ${dayjs(filters.fecha_fin).format('DD/MM/YYYY')}`
    : rangeText;

  return (
    <div className="bg-white border rounded-2xl shadow-sm border-[#e5e7eb] overflow-hidden mb-8">
      <div className={`${HEADER_CLASS} bg-[#DC2626] cursor-pointer hover:bg-[#b91c1c] transition-colors`} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className="text-base font-bold flex items-center gap-2">
          Llantas sin Movimiento en: <span className="text-white font-black">{localRangeText}</span>
        </h3>
        <button className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <DynamicTableFilter 
            configs={SPEC_CONFIGS} 
            filters={filters} 
            updateFilter={updateFilter} 
          />

          <div className="hidden md:block overflow-x-auto relative">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-[#f8fafc]">
                <tr>
                  <SortableHeader label="Producto" sortKey="nombre" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Atención" sortKey="tiempo_atencion" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Días" sortKey="dias_sin_vista" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <th className="px-4 py-2 text-xs font-bold text-right text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((p) => (
                  <tr key={p.id_producto} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center py-1 gap-2">
                        <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 border border-gray-200 rounded">
                          {p.imagen_url ? (
                            <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div className="text-xs font-bold leading-tight text-gray-900">{p.nombre}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs font-medium text-center text-gray-600">{p.tiempo_atencion || 0}s</td>
                    <td className="px-4 py-2 text-xs font-black text-center text-red-500">{p.dias_sin_vista} d</td>
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                        disabled={isPreviewLoading === p.id_producto}
                        className="p-1.5 text-[#027EB1] hover:bg-[#EAF7FD] rounded-lg transition-colors disabled:opacity-50"
                        title="Vista previa"
                      >
                        {isPreviewLoading === p.id_producto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No hay resultados con estos filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4 px-4 py-4 relative min-h-[150px]">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            {paginatedData.map((p) => (
              <div key={p.id_producto} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex items-center gap-3 w-full">
                    <div className="overflow-hidden bg-gray-100 border border-gray-200 rounded-lg shrink-0 w-12 h-12">
                      {p.imagen_url ? (
                        <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="flex-1 text-sm font-bold text-gray-900 leading-tight pr-2">{p.nombre}</div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Atención</span>
                    <span className="text-sm font-medium text-gray-900">{p.tiempo_atencion || 0}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Días sin Vistas</span>
                    <span className="text-sm font-black text-red-500">{p.dias_sin_vista} d</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                    disabled={isPreviewLoading === p.id_producto}
                    className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#027EB1] hover:text-[#026085] disabled:opacity-50"
                  >
                    {isPreviewLoading === p.id_producto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && (
              <div className="text-center text-gray-400 py-6 text-sm">No hay resultados</div>
            )}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      
      <ProductViewModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct}
      />
    </div>
  );
});

export const OportunidadesTable = forwardRef(({ 
  initialData, 
  baseParams,
  rangeText
}: { 
  initialData: TopProductoData[], 
  baseParams: any,
  rangeText: string
}, ref) => {
  const [data, setData] = useState<TopProductoData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const { filters, debouncedFilters, updateFilter, clearFilters } = useTableFilters<Record<string, any>>({ 
    min_conversion: 0, 
    max_conversion: 10,
    fecha_inicio: undefined,
    fecha_fin: undefined
  });

  useEffect(() => {
    if (baseParams.fecha_inicio) updateFilter('fecha_inicio', baseParams.fecha_inicio);
    if (baseParams.fecha_fin) updateFilter('fecha_fin', baseParams.fecha_fin);
  }, [baseParams.fecha_inicio, baseParams.fecha_fin]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useImperativeHandle(ref, () => ({
    expand: () => setIsCollapsed(false),
    applyFilter: (key: string, value: any) => {
      setIsCollapsed(false);
      updateFilter(key, value);
    },
    clearAll: () => clearFilters()
  }));

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handlePreview = async (id: number) => {
    setIsPreviewLoading(id);
    try {
      const response = await api.get(`/api/products/${id}`);
      const p = response.data.producto;
      setSelectedProduct({
        id: p.id_producto,
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        precio: p.precios?.detalle || 0,
        stock: p.stock_total || 0,
        descripcion: p.descripcion || "",
        imagenes: p.imagenes?.map((img: any) => ({ url: img.url, id: img.id })) || [],
        ancho: p.especificaciones?.ancho_rin?.toString() || "",
        perfil: p.especificaciones?.alto_rin?.toString() || "",
        rin: p.especificaciones?.rin?.toString() || "",
        lonas: p.especificaciones?.lonas?.toString() || "",
        profundidad: p.especificaciones?.profundidad?.toString() || "",
        presionMaxima: p.especificaciones?.presion_maxima?.toString() || "",
        indiceVelocidad: p.especificaciones?.indice_velocidad?.toString() || "",
        indiceCarga: p.especificaciones?.indice_de_carga?.toString() || "",
        modelo3D: p.imagen_3d ? { url: p.imagen_3d } : undefined
      });
    } catch (error) {
      console.error("Error fetching product preview", error);
    } finally {
      setIsPreviewLoading(null);
    }
  };

  useEffect(() => {
    let cancel = false;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const cleanFilters = Object.fromEntries(Object.entries(debouncedFilters).filter(([_, v]) => v !== undefined && v !== ''));
        const res = await getOportunidades({ ...baseParams, ...cleanFilters });
        if (!cancel) {
          setData(res);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Filter error", err);
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };
    fetchFiltered();
    return () => { cancel = true; };
  }, [debouncedFilters, baseParams]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const localRangeText = (filters.fecha_inicio && filters.fecha_fin)
    ? `${dayjs(filters.fecha_inicio).format('DD/MM/YYYY')} - ${dayjs(filters.fecha_fin).format('DD/MM/YYYY')}`
    : rangeText;

  return (
    <div className="bg-white border rounded-2xl shadow-sm border-[#e5e7eb] overflow-hidden mb-8">
      <div className={`${HEADER_CLASS} bg-[#027EB1] cursor-pointer hover:bg-[#026085] transition-colors`} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className="text-base font-bold flex items-center gap-2">
          Oportunidades en: <span className="text-white font-black">{localRangeText}</span>
        </h3>
        <button className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <DynamicTableFilter 
            configs={SPEC_CONFIGS} 
            filters={filters} 
            updateFilter={updateFilter} 
            mainFilter={{
              keys: ['min_conversion', 'max_conversion'],
              label: 'Efectividad de Ventas (%)',
              type: 'range',
              unit: '%'
            }}
          />

          <div className="hidden md:block overflow-x-auto relative">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-[#f8fafc]">
                <tr>
                  <SortableHeader label="Producto" sortKey="nombre" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Vistas" sortKey="vistas" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Ventas" sortKey="ventas" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Aten." sortKey="tiempo_promedio_segundos" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Efectividad" sortKey="conversion" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <th className="px-4 py-2 text-xs font-bold text-right text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((p) => (
                  <tr key={p.id_producto} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center py-1 gap-2">
                        <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 border border-gray-200 rounded">
                          {p.imagen_url ? (
                            <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div className="text-xs font-bold leading-tight text-gray-900">{p.nombre}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs font-bold text-center text-gray-900">{p.vistas}</td>
                    <td className="px-2 py-2 text-xs font-bold text-center text-gray-700">{p.ventas || 0}</td>
                    <td className="px-2 py-2 text-xs text-center text-gray-500">{p.tiempo_promedio_segundos || 0}s</td>
                    <td className="px-4 py-2 text-xs font-black text-center text-red-600">{p.conversion}%</td>
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                        disabled={isPreviewLoading === p.id_producto}
                        className="p-1.5 text-[#027EB1] hover:bg-[#EAF7FD] rounded-lg transition-colors disabled:opacity-50"
                        title="Vista previa"
                      >
                        {isPreviewLoading === p.id_producto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No hay resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden space-y-4 px-4 py-4 relative min-h-[150px]">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            {paginatedData.map((p) => (
              <div key={p.id_producto} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex items-center gap-3 w-full">
                    <div className="overflow-hidden bg-gray-100 border border-gray-200 rounded-lg shrink-0 w-12 h-12">
                      {p.imagen_url ? (
                        <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="flex-1 text-sm font-bold text-gray-900 leading-tight pr-2">{p.nombre}</div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Vistas</span>
                    <span className="text-sm font-bold text-gray-900">{p.vistas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Ventas</span>
                    <span className="text-sm font-bold text-gray-700">{p.ventas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Aten.</span>
                    <span className="text-sm font-medium text-gray-500">{p.tiempo_promedio_segundos || 0}s</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                    <span className="text-xs text-red-700 uppercase tracking-wider font-bold">Efectividad</span>
                    <span className="text-sm font-black text-red-600">{p.conversion}%</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                    disabled={isPreviewLoading === p.id_producto}
                    className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#027EB1] hover:text-[#026085] disabled:opacity-50"
                  >
                    {isPreviewLoading === p.id_producto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && (
              <div className="text-center text-gray-400 py-6 text-sm">No hay resultados</div>
            )}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      
      <ProductViewModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct}
      />
    </div>
  );
});

export const TopProductosTable = forwardRef(({ initialData, baseParams, rangeText }: { initialData: TopProductoData[], baseParams: any, rangeText: string }, ref) => {
  const [data, setData] = useState<TopProductoData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const { filters, debouncedFilters, updateFilter, clearFilters } = useTableFilters<Record<string, any>>({
    fecha_inicio: undefined,
    fecha_fin: undefined
  });

  useEffect(() => {
    if (baseParams.fecha_inicio) updateFilter('fecha_inicio', baseParams.fecha_inicio);
    if (baseParams.fecha_fin) updateFilter('fecha_fin', baseParams.fecha_fin);
  }, [baseParams.fecha_inicio, baseParams.fecha_fin]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'vistas', direction: 'desc' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const itemsPerPage = 5;

  useImperativeHandle(ref, () => ({
    expand: () => setIsCollapsed(false),
    applyFilter: (key: string, value: any) => {
      setIsCollapsed(false);
      updateFilter(key, value);
    },
    clearAll: () => clearFilters()
  }));

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handlePreview = async (id: number) => {
    setIsPreviewLoading(id);
    try {
      const response = await api.get(`/api/products/${id}`);
      const p = response.data.producto;
      setSelectedProduct({
        id: p.id_producto,
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        precio: p.precios?.detalle || 0,
        stock: p.stock_total || 0,
        descripcion: p.descripcion || "",
        imagenes: p.imagenes?.map((img: any) => ({ url: img.url, id: img.id })) || [],
        ancho: p.especificaciones?.ancho_rin?.toString() || "",
        perfil: p.especificaciones?.alto_rin?.toString() || "",
        rin: p.especificaciones?.rin?.toString() || "",
        lonas: p.especificaciones?.lonas?.toString() || "",
        profundidad: p.especificaciones?.profundidad?.toString() || "",
        presionMaxima: p.especificaciones?.presion_maxima?.toString() || "",
        indiceVelocidad: p.especificaciones?.indice_velocidad?.toString() || "",
        indiceCarga: p.especificaciones?.indice_de_carga?.toString() || "",
        modelo3D: p.imagen_3d ? { url: p.imagen_3d } : undefined
      });
    } catch (error) {
      console.error("Error fetching product preview", error);
    } finally {
      setIsPreviewLoading(null);
    }
  };

  useEffect(() => {
    let cancel = false;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const cleanFilters = Object.fromEntries(Object.entries(debouncedFilters).filter(([_, v]) => v !== undefined && v !== ''));
        const res = await getTopProductos({ ...baseParams, ...cleanFilters });
        if (!cancel) {
          setData(res);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Filter error", err);
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };
    fetchFiltered();
    return () => { cancel = true; };
  }, [debouncedFilters, baseParams]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const localRangeText = (filters.fecha_inicio && filters.fecha_fin)
    ? `${dayjs(filters.fecha_inicio).format('DD/MM/YYYY')} - ${dayjs(filters.fecha_fin).format('DD/MM/YYYY')}`
    : rangeText;

  return (
    <div className="bg-white border rounded-2xl shadow-sm border-[#e5e7eb] overflow-hidden mb-8">
      <div className={`${HEADER_CLASS} bg-[#003E7B] cursor-pointer hover:bg-[#00346a] transition-colors`} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className="text-base font-bold flex items-center gap-2">
          Productos vistos en periodo: <span className="text-white font-black">{localRangeText}</span>
        </h3>
        <button className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <DynamicTableFilter configs={SPEC_CONFIGS} filters={filters} updateFilter={updateFilter} />

          <div className="hidden overflow-x-auto md:block relative">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-[#f8fafc]">
                <tr>
                  <SortableHeader label="Producto" sortKey="nombre" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Vistas" sortKey="vistas" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Ventas" sortKey="ventas" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader label="Atención Prom." sortKey="tiempo_promedio_segundos" currentSort={sortConfig} onSort={handleSort} align="center" />
                  <th className="px-4 py-2 text-xs font-bold text-right text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((p) => (
                  <tr key={p.id_producto} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 overflow-hidden bg-gray-100 border border-gray-200 rounded-lg">
                          {p.imagen_url ? (
                            <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-6 h-6" /></div>
                          )}
                        </div>
                        <div className="text-sm font-bold leading-tight text-gray-900">{p.nombre}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-gray-800 text-sm">{p.vistas}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-[#10B981] text-sm">{p.ventas || 0}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700 font-bold text-sm">{p.tiempo_promedio_segundos || 0}s</td>

                    <td className="px-4 py-2.5 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                        disabled={isPreviewLoading === p.id_producto}
                        className="p-1.5 text-[#027EB1] hover:bg-[#EAF7FD] rounded-lg transition-colors disabled:opacity-50"
                        title="Vista previa"
                      >
                        {isPreviewLoading === p.id_producto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">No hay resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden space-y-4 px-4 py-4 relative min-h-[150px]">
            {isLoading && <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center pointer-events-none">Cargando...</div>}
            {paginatedData.map((p) => (
              <div key={p.id_producto} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex items-center gap-3 w-full">
                    <div className="overflow-hidden bg-gray-100 border border-gray-200 rounded-lg shrink-0 w-12 h-12">
                      {p.imagen_url ? (
                        <img src={`${import.meta.env.VITE_API_URL}/public/${p.imagen_url}`} className="object-cover w-full h-full" alt={p.nombre} />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400"><Layers className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="flex-1 text-sm font-bold text-gray-900 leading-tight pr-2">{p.nombre}</div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Vistas</span>
                    <span className="text-sm font-bold text-gray-900">{p.vistas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Ventas</span>
                    <span className="text-sm font-bold text-[#10B981]">{p.ventas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Atención</span>
                    <span className="text-sm font-medium text-gray-500">{p.tiempo_promedio_segundos || 0}s</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePreview(p.id_producto); }}
                    disabled={isPreviewLoading === p.id_producto}
                    className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-[#027EB1] hover:text-[#026085] disabled:opacity-50"
                  >
                    {isPreviewLoading === p.id_producto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && (
              <div className="text-center text-gray-400 py-6 text-sm">No hay resultados</div>
            )}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      
      <ProductViewModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct}
      />
    </div>
  );
});
