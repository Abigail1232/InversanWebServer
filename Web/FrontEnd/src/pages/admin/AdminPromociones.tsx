import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Tooltip,
  message,
  Upload,
  Pagination,
  ConfigProvider,
  Switch,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import { FilterX, Pencil } from "lucide-react";

import {
  getPromociones,
  eliminarPromocion,
  getPromocionDetalle,
  editarPromocion,
  actualizarConfigVisualizacion
} from "../../api/admin/promociones";

type PromotionRow = {
  id: number;
  promocion: string;
  fechaInicio: string;
  fechaFinalizacion: string;
  mostrarPorcentaje: boolean;
};

// Componente de filtros personalizado para promociones
interface PromotionFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  fechaInicio: Dayjs | null;
  onFechaInicioChange: (date: Dayjs | null) => void;
  fechaFinal: Dayjs | null;
  onFechaFinalChange: (date: Dayjs | null) => void;
  onCrearClick: () => void;
  onClearFilters: () => void;
}

const PromotionFilters = ({
  searchValue,
  onSearchChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFinal,
  onFechaFinalChange,
  onCrearClick,
  onClearFilters,
}: PromotionFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Campo de búsqueda */}
        <div className="w-full sm:min-w-[250px] sm:flex-1">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027EB1] pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título..."
              className="h-10 w-full rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:outline-none pl-10 pr-3 text-slate-700 placeholder:text-slate-400 text-base"
            />
          </div>
        </div>

        {/* Filtro de fecha inicio */}
        <div className="w-full sm:w-auto sm:min-w-[150px]">
          <DatePicker
            placeholder="Fecha Inicio"
            value={fechaInicio}
            onChange={onFechaInicioChange}
            className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:outline-none text-base [&_.ant-picker-input]:text-base [&_.ant-picker-input]:text-slate-700 [&_.ant-picker-input::placeholder]:text-slate-400"
          />
        </div>

        {/* Filtro de fecha final */}
        <div className="w-full sm:w-auto sm:min-w-[150px]">
          <DatePicker
            placeholder="Fecha Final"
            value={fechaFinal}
            onChange={onFechaFinalChange}
            className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:outline-none text-base [&_.ant-picker-input]:text-base [&_.ant-picker-input]:text-slate-700 [&_.ant-picker-input::placeholder]:text-slate-400"
          />
        </div>

        {/* Botón limpiar filtros */}
        <div className="grid w-full grid-cols-[44px_minmax(0,1fr)] gap-3 sm:flex sm:w-auto sm:grid-cols-none">
          <button
            type="button"
            onClick={onClearFilters}
            title="Limpiar filtros"
            className="flex items-center justify-center h-10 w-11 rounded-xl border border-[#D7E3F0] bg-white text-slate-600 hover:text-[#D61216] hover:border-[#D61216] transition-all group"
          >
            <FilterX className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Botón Crear */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="!h-10 !w-full sm:!w-auto !rounded-xl !align-middle !border-none !bg-[#027EB1] hover:!bg-[#026a96] !shadow-none !text-base !font-semibold !inline-flex !items-center !justify-center px-5"
            onClick={onCrearClick}
          >
            Crear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPromociones() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState<Dayjs | null>(
    null,
  );
  const [fechaFinalFiltro, setFechaFinalFiltro] = useState<Dayjs | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionRow | null>(null);
  const [verModalOpen, setVerModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [promoDetalle, setPromoDetalle] = useState<any>(null);
  const [editarBannerFile, setEditarBannerFile] = useState<File | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchValue("");
    setFechaInicioFiltro(null);
    setFechaFinalFiltro(null);
  };

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    const response = await getPromociones(searchValue);
    if (response.ok) {
      const mappedData: PromotionRow[] = response.promociones.map((p: any) => ({
        id: p.id_promocion,
        promocion: p.titulo,
        fechaInicio: p.fecha_inicio,
        fechaFinalizacion: p.fecha_finalizacion,
        mostrarPorcentaje: Boolean(p.mostrar_precio_porcentaje),
      }));
      setPromotions(mappedData);
    } else {
      message.error("Error al obtener promociones");
    }
    setLoading(false);
  }, [searchValue]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((item) => {
      const matchesSearch = item.promocion
        .toLowerCase()
        .includes(searchValue.toLowerCase());

      if (!matchesSearch) return false;

      const itemStart = dayjs(item.fechaInicio).startOf("day");
      const itemEnd = dayjs(item.fechaFinalizacion).endOf("day");

      const filterStart = fechaInicioFiltro
        ? fechaInicioFiltro.startOf("day")
        : null;
      const filterEnd = fechaFinalFiltro ? fechaFinalFiltro.endOf("day") : null;

      const cumpleInicio = filterStart
        ? itemStart.isAfter(filterStart) || itemStart.isSame(filterStart)
        : true;

      const cumpleFin = filterEnd
        ? itemEnd.isBefore(filterEnd) || itemEnd.isSame(filterEnd)
        : true;

      return cumpleInicio && cumpleFin;
    });
  }, [promotions, searchValue, fechaInicioFiltro, fechaFinalFiltro]);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPromotions.slice(start, start + pageSize);
  }, [filteredPromotions, currentPage]);

  const handleVer = async (id: number) => {
    const data = await getPromocionDetalle(id);
    if (data?.ok) {
      setPromoDetalle(data.promocion);
      setVerModalOpen(true);
    }
  };

  const handleEditar = async (id: number) => {
    const data = await getPromocionDetalle(id);
    if (data?.ok) {
      setPromoDetalle(data.promocion);
      setEditarBannerFile(null); // Limpiar archivo anterior
      setEditarModalOpen(true);
    }
  };

  const handleGuardarCambios = async () => {
    if (!promoDetalle) return;

    const formData = new FormData();
    formData.append("titulo", promoDetalle.titulo);
    formData.append("descripcion", promoDetalle.descripcion || "");
    formData.append("fecha_inicio", promoDetalle.fecha_inicio);
    formData.append("fecha_finalizacion", promoDetalle.fecha_finalizacion);

    // Agregar banner si se subió uno nuevo
    if (editarBannerFile) {
      formData.append("banner", editarBannerFile);
    }

    const res = await editarPromocion(promoDetalle.id_promocion, formData);
    if (res.ok) {
      message.success("Promoción actualizada correctamente");
      setEditarModalOpen(false);
      setEditarBannerFile(null); // Limpiar archivo
      fetchPromos();
    } else {
      message.error(res.msg);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;
    const success = await eliminarPromocion(selectedPromotion.id);
    if (success) {
      message.success("Promoción eliminada");
      fetchPromos();
    }
    setDeleteModalOpen(false);
  };

  const columns: DataTableColumn<PromotionRow>[] = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Promoción", dataIndex: "promocion", key: "promocion" },
    {
      title: "Fecha de Inicio",
      dataIndex: "fechaInicio",
      key: "fechaInicio",
      render: (value) => dayjs(String(value)).format("DD-MM-YYYY"),
    },
    {
      title: "Fecha de Finalización",
      dataIndex: "fechaFinalizacion",
      key: "fechaFinalizacion",
      render: (value) => dayjs(String(value)).format("DD-MM-YYYY"),
    },
    {
      title: "Mostrar Porcentaje",
      key: "mostrarPorcentaje",
      width: 150,
      render: (_, record) => (
        <div className="flex justify-center">
          <Switch
            checked={record.mostrarPorcentaje || false}
            onChange={async (checked) => {
              try {
                await actualizarConfigVisualizacion(record.id, checked);
                window.dispatchEvent(
                  new CustomEvent("promotionVisualizacionChange", {
                    detail: { tipo: checked ? "porcentaje" : "precio_tachado" },
                  }),
                );
                // Actualizar el estado local
                setPromotions(prev =>
                  prev.map(p =>
                    p.id === record.id ? { ...p, mostrarPorcentaje: checked } : p
                  )
                );
              } catch (error) {
                console.error("Error al actualizar configuración:", error);
                message.error("Error al actualizar la configuración");
              }
            }}
            style={{ backgroundColor: (record.mostrarPorcentaje || false) ? "#16A34A" : "#D1D5DB" }}
          />
        </div>
      ),
    },
    {
      title: "Estado",
      key: "estado",
      width: 120,
      render: (_, record) => {
        const isExpired = dayjs().isAfter(dayjs(record.fechaFinalizacion), "day");
        return (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isExpired
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isExpired ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            {isExpired ? "Vencida" : "Activa"}
          </div>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div className="flex gap-4 justify-center">
          <Tooltip title="Ver">
            <EyeOutlined
              className="text-[18px] cursor-pointer text-[#027EB1] hover:opacity-80"
              onClick={() => handleVer(record.id)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Pencil
              className="w-5 h-5 cursor-pointer text-[#027EB1] hover:text-[#026085] transition-colors"
              onClick={() => handleEditar(record.id)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <DeleteOutlined
              className="text-[18px] cursor-pointer text-[#e11d48] hover:opacity-80"
              onClick={() => {
                setSelectedPromotion(record);
                setDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
  <ConfigProvider>
    <div className="w-full bg-[#F5F7FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="mb-5">
          <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
            Administración de Promociones
          </h1>
          <div className="text-sm text-slate-500 mt-1">
            Gestiona las cuentas de usuario, asigna roles de acceso y supervisa
            el estado de actividad de los clientes en la plataforma.
          </div>
        </div>

        {/* Componente de filtros */}
        <PromotionFilters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          fechaInicio={fechaInicioFiltro}
          onFechaInicioChange={setFechaInicioFiltro}
          fechaFinal={fechaFinalFiltro}
          onFechaFinalChange={setFechaFinalFiltro}
          onCrearClick={() => navigate("/admin/promotions/add")}
          onClearFilters={clearFilters}
        />

        <div className="hidden md:block">
          <DataTable
            rowKey="id"
            columns={columns}
            dataSource={paginatedData}
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredPromotions.length,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </div>

        <div className="md:hidden mt-5 flex flex-col gap-3">
          {paginatedData.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">
                    {promo.promocion}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-slate-500">ID: {promo.id}</div>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        dayjs().isAfter(dayjs(promo.fechaFinalizacion), "day")
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {dayjs().isAfter(dayjs(promo.fechaFinalizacion), "day")
                        ? "Vencida"
                        : "Activa"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip title="Ver">
                    <EyeOutlined
                      className="text-[18px] cursor-pointer text-[#6b7280] hover:text-[#4b5563]"
                      onClick={() => handleVer(promo.id)}
                    />
                  </Tooltip>
                  <Tooltip title="Editar">
                    <EditOutlined
                      className="text-[18px] cursor-pointer text-[#0B4E87] hover:opacity-80"
                      onClick={() => handleEditar(promo.id)}
                    />
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <DeleteOutlined
                      className="text-[18px] cursor-pointer text-[#e11d48] hover:text-[#be123c]"
                      onClick={() => {
                        setSelectedPromotion(promo);
                        setDeleteModalOpen(true);
                      }}
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Fecha Inicio</div>
                <div className="text-slate-700 text-right">
                  {dayjs(String(promo.fechaInicio)).format("DD-MM-YYYY")}
                </div>

                <div className="text-slate-500">Fecha Fin</div>
                <div className="text-slate-700 text-right">
                  {dayjs(String(promo.fechaFinalizacion)).format("DD-MM-YYYY")}
                </div>
              </div>
            </div>
          ))}

          {/* Paginación para móvil */}
          {filteredPromotions.length > pageSize && (
            <div className="flex justify-center mt-4 pt-2">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredPromotions.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper={false}
                simple
              />
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL EDITAR (Basado en Figma) --- */}
      <Modal
        open={editarModalOpen}
        onCancel={() => setEditarModalOpen(false)}
        footer={null}
        width={550}
        centered
        title={
          <span className="text-[20px] font-bold text-[#1e2939] px-2">
            Editar Promoción
          </span>
        }
        className="custom-modal"
      >
        {promoDetalle && (
          <div className="flex flex-col gap-5 px-2 pt-4">
            <div>
              <label className="text-[14px] font-medium text-gray-700 mb-2 block">
                Nombre de la Promoción
              </label>
              <Input
                value={promoDetalle.titulo}
                placeholder="Ej. Buen Fin Llantas"
                onChange={(e) =>
                  setPromoDetalle({ ...promoDetalle, titulo: e.target.value })
                }
                className="rounded-lg h-10 border-gray-200"
              />
            </div>

            <div>
              <label className="text-[14px] font-medium text-gray-700 mb-2 block">
                Descripción
              </label>
              <Input.TextArea
                rows={4}
                placeholder="Describe los detalles de la promoción..."
                value={promoDetalle.descripcion}
                onChange={(e) =>
                  setPromoDetalle({
                    ...promoDetalle,
                    descripcion: e.target.value,
                  })
                }
                className="rounded-lg border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[14px] font-medium text-gray-700 mb-2 block">
                  Fecha de Inicio
                </label>
                <DatePicker
                  className="w-full h-10 rounded-lg"
                  value={
                    promoDetalle.fecha_inicio
                      ? dayjs(promoDetalle.fecha_inicio)
                      : null
                  }
                  onChange={(date) =>
                    setPromoDetalle({
                      ...promoDetalle,
                      fecha_inicio: date?.toISOString(),
                    })
                  }
                  format="DD-MM-YYYY"
                />
              </div>
              <div>
                <label className="text-[14px] font-medium text-gray-700 mb-2 block">
                  Fecha de Finalización
                </label>
                <DatePicker
                  className="w-full h-10 rounded-lg"
                  value={
                    promoDetalle.fecha_finalizacion
                      ? dayjs(promoDetalle.fecha_finalizacion)
                      : null
                  }
                  onChange={(date) =>
                    setPromoDetalle({
                      ...promoDetalle,
                      fecha_finalizacion: date?.toISOString(),
                    })
                  }
                  format="DD-MM-YYYY"
                />
              </div>
            </div>

            <div>
              <label className="text-[14px] font-medium text-gray-700 mb-2 block">
                Banner de la Promoción
              </label>

              {/* Mostrar banner actual */}
              {promoDetalle.banner_url && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Banner actual:</p>
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={`http://localhost:3000/assets/${promoDetalle.banner_url}`}
                      className="w-full h-full object-cover"
                      alt="Banner actual"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x100";
                      }}
                    />
                  </div>
                </div>
              )}

              <Upload.Dragger
                className="rounded-xl bg-gray-50 border-dashed border-2 border-gray-200 py-4"
                accept="image/*"
                beforeUpload={(file) => {
                  setEditarBannerFile(file);
                  return false; // Prevenir auto-upload
                }}
                onRemove={() => {
                  setEditarBannerFile(null);
                }}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon text-[#0B4E87]">
                  <CloudUploadOutlined className="text-3xl" />
                </p>
                <p className="text-gray-400 text-sm">
                  {editarBannerFile
                    ? editarBannerFile.name
                    : "Haz clic o arrastra una imagen para subirla"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {editarBannerFile
                    ? "Archivo seleccionado"
                    : "Solo se permite una imagen"}
                </p>
              </Upload.Dragger>
            </div>

            <div className="flex gap-3 justify-end mt-6 pb-2">
              <Button
                onClick={() => setEditarModalOpen(false)}
                className="rounded-lg px-8 h-11 border-gray-300 font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="primary"
                className="bg-[#005187] hover:bg-[#003d66] rounded-lg px-8 h-11 font-medium"
                onClick={handleGuardarCambios}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL DETALLE / PREVISUALIZACIÓN (Basado en Figma) --- */}
      <Modal
        open={verModalOpen}
        onCancel={() => setVerModalOpen(false)}
        footer={null}
        width={500}
        centered
        title={
          <span className="text-[18px] font-semibold text-[#1e2939] px-2">
            Detalle de Promoción
          </span>
        }
        className="preview-modal"
      >
        {promoDetalle && (
          <div className="flex flex-col">
            <div className="px-4 py-2 border-t border-gray-100">
              <h2 className="text-[22px] font-bold text-[#1e2939] mb-4 mt-2">
                {promoDetalle.titulo}
              </h2>

              {/* Banner Principal */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img
                  src={
                    promoDetalle.banner_url
                      ? `http://localhost:3000/assets/${promoDetalle.banner_url}`
                      : "/placeholder-banner.png"
                  }
                  className="w-full h-full object-cover"
                  alt="Promo Banner"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-banner.png";
                  }}
                />
              </div>

              <p className="text-gray-600 text-[15px] mb-6 leading-relaxed">
                {promoDetalle.descripcion || "Sin descripción disponible."}
              </p>

              {/* Sección de Productos */}
              <h3 className="text-[16px] font-bold text-[#1e2939] mb-4">
                Productos incluidos en la promoción
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {promoDetalle.producto_promocion
                  ?.slice(0, 4)
                  .map((item: any) => {
                    const producto = item.producto;
                    const imagen = producto.producto_imagen?.[0];
                    const precioOriginal = Number(
                      producto.precio_detalle || producto.precio_mayoreo || 0,
                    );
                    const descuento = Math.round(Number(item.descuento || 0) * 100) / 100;
                    const esMonto = item.tipo_descuento === "monto";
                    const precioPromoFijo = item.precio_promocion;
                    const precioPromocion = esMonto && precioPromoFijo
                      ? Number(precioPromoFijo)
                      : descuento > 0
                        ? Math.round((precioOriginal * (1 - descuento / 100)) * 100) / 100
                        : precioOriginal;
                    const mostrarPrecioTachado = descuento > 0 || (esMonto && precioOriginal > precioPromocion);
                    const baseUrl =
                      (
                        import.meta.env.VITE_API_URL as string | undefined
                      )?.replace(/\/+$/, "") ?? "";

                    return (
                      <div
                        key={producto.id_producto}
                        className="border border-gray-100 rounded-2xl p-3 shadow-sm bg-white"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden mb-3">
                          {imagen ? (
                            <img
                              src={`${baseUrl}/assets/${imagen.imagen_url}`}
                              className="w-full h-full object-cover"
                              alt={producto.nombre}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/150";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs text-center px-2">
                                Sin imagen
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-[13px] font-medium text-gray-800 line-clamp-2 mb-1">
                          {producto.nombre}
                        </p>

                        <p className="text-[#0B4E87] font-bold text-[14px]">
                          L{" "}
                          {precioPromocion.toLocaleString("es-HN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>

                        {mostrarPrecioTachado && (
                          <p className="text-gray-400 text-xs line-through">
                            L{" "}
                            {precioOriginal.toLocaleString("es-HN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer de Vigencia (Azul clarito) */}
            <div className="bg-[#f8fafc] border-t border-dashed border-[#0B4E87] p-4 flex items-center gap-2 text-[#0B4E87] rounded-b-lg">
              <CalendarOutlined />
              <span className="text-[13px] font-medium">
                Vigencia:{" "}
                {dayjs(promoDetalle.fecha_inicio).format("DD/MM/YYYY")} -{" "}
                {dayjs(promoDetalle.fecha_finalizacion).format("DD/MM/YYYY")}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDelete}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, className: "rounded-md" }}
        cancelButtonProps={{ className: "rounded-md" }}
        title="Confirmar Eliminación"
      >
        <p className="py-4 text-center text-lg">
          ¿Estás seguro que deseas eliminar la promoción <br />
          <span className="font-bold text-[#e11d48]">
            "{selectedPromotion?.promocion}"
          </span>
          ?
        </p>
      </Modal>
    </div>
  </ConfigProvider>
  );
}