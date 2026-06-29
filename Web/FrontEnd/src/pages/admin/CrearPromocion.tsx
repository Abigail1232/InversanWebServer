import { useState } from "react";
import { Button, Input, Upload, message, DatePicker,ConfigProvider } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import ModificarProductosModal from "../../components/modal/ModificarProductosModal";
import { crearPromocion } from "../../api/admin/promociones";
import { formatPrice } from "../../utils/formatPrice";

const { TextArea } = Input;

interface ProductoFila {
  id_producto: number;
  codigo: string;
  nombre: string;
  marca: string;
  stock: number;
  precio: number;
  descuento: number;
  tipo_descuento?: "porcentaje" | "monto";
  precioPromocion?: number;
}

export default function CrearPromocion() {
  const navigate = useNavigate();

  // --- ESTADOS DEL FORMULARIO ---
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState(""); // <-- Agregado
  const [fechaInicio, setFechaInicio] = useState<any>(null);
  const [fechaFin, setFechaFin] = useState<any>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoFila[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- COLUMNAS (DISEÑO ORIGINAL) ---
  const columns: DataTableColumn<ProductoFila>[] = [
    { title: "CÓDIGO", dataIndex: "id_producto", key: "id_producto" },
    { title: "STOCK", dataIndex: "stock", key: "stock" },
    { title: "APLICABLE A", dataIndex: "nombre", key: "nombre" },
    {
      title: "SUBTOTAL",
      dataIndex: "precio",
      key: "precio",
      render: (val: any) => `L. ${Number(val).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: "DESCUENTO",
      dataIndex: "descuento",
      key: "descuento",
      render: (val: any) => (
      <span className="text-gray-700 font-medium bg-transparent">
        {val}%
      </span>
      )
    },
    {
      title: "ISV",
      key: "isv",
      render: (_, record) => `L. ${(Math.round((record.precio * 0.15) * 100) / 100).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: "TOTAL",
      key: "total_desc",
      render: (_: any, record: ProductoFila) => {
        const subtotal = Math.round((record.precio * (1 - record.descuento / 100)) * 100) / 100;
        const totalConIsv = Math.round((subtotal * 1.15) * 100) / 100;
        return <span className="font-ULTRAbold text-[#0B4E87]">L. {totalConIsv.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      }
    },
    {
      title: "VISTA PREVIA",
      key: "vista_previa",
      render: (_: any, record: ProductoFila) => {
        const tieneDescuento = record.descuento > 0;
        const precioPromo = record.precioPromocion ?? record.precio;

        if (tieneDescuento && record.precio > precioPromo) {
          return (
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-xs text-gray-400 line-through">
                L. {formatPrice(record.precio)}
              </span>
              <span className="text-sm font-bold text-[#00a65a]">
                L. {formatPrice(precioPromo)}
              </span>
            </div>
          );
        }
        return <span className="text-gray-400 text-xs">Sin descuento</span>;
      },
    },
  ];

  const handleConfirmar = async () => {
    // Validación actualizada: ahora descripción y banner son obligatorios para evitar el error 500
    if (!titulo || !descripcion || !fechaInicio || !fechaFin || !bannerFile || productosSeleccionados.length === 0) {
      return message.warning("Todos los campos son obligatorios: título, descripción, fechas, banner y productos.");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion); // <-- Agregado
    formData.append("fecha_inicio", fechaInicio.format("YYYY-MM-DD"));
    formData.append("fecha_finalizacion", fechaFin.format("YYYY-MM-DD"));
    formData.append("banner", bannerFile);

    const productosParaBack = productosSeleccionados.map(p => ({
      id_producto: p.id_producto,
      descuento: p.descuento,
      tipo_descuento: p.tipo_descuento || "porcentaje",
      precio_promocion: p.tipo_descuento === "monto" && p.precioPromocion 
        ? p.precioPromocion 
        : undefined
    }));
    formData.append("productos", JSON.stringify(productosParaBack));

    try {
      const res = await crearPromocion(formData);
      if (res.ok) {
        message.success("¡Promoción creada con éxito!");
        navigate("/admin/promotions");
      } else {
        message.error(res.msg);
      }
    } catch (error) {
      message.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
  <ConfigProvider>
    <div className="p-10 max-w-[1440px] mx-auto min-h-screen">
      <h1 className="text-4xl font-semibold text-[#1e2939] mb-8">Crear Promoción</h1>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-10">

          {/* TÍTULO */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Título de Promoción</label>
            <Input
              placeholder="Ej. Súper Oferta de Verano"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-12 rounded-lg border-gray-300 text-lg"
            />
          </div>

          {/* DESCRIPCIÓN (NUEVO CAMPO) */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Descripción</label>
            <TextArea
              placeholder="Escribe una breve descripción de la promoción..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="rounded-lg border-gray-300 text-lg"
              rows={3}
            />
          </div>

          {/* VIGENCIA SEPARADA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Fecha de inicio</label>
              <DatePicker
                className="h-12 w-full rounded-lg border-gray-300"
                placeholder="Seleccionar fecha"
                onChange={(date) => setFechaInicio(date)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Fecha de finalización</label>
              <DatePicker
                className="h-12 w-full rounded-lg border-gray-300"
                placeholder="Seleccionar fecha"
                onChange={(date) => setFechaFin(date)}
              />
            </div>
          </div>

          {/* BANNER CON DISEÑO ORIGINAL Y PREVIEW */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Banner de Promoción</label>
            <div className="relative group">
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 h-[250px]">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      danger
                      shape="circle"
                      icon={<Trash2 className="w-5 h-5" />}
                      onClick={() => { setPreviewUrl(null); setBannerFile(null); }}
                      className="h-12 w-12 text-xl"
                    />
                  </div>
                </div>
              ) : (
                <Upload.Dragger
                  maxCount={1}
                  beforeUpload={(file) => {
                    setBannerFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    return false;
                  }}
                  showUploadList={false}
                >
                  <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-[#0081B4] transition-all py-10 flex flex-col items-center justify-center">
                    <CloudUploadOutlined className="text-5xl text-[#0081B4] mb-3" />
                    <p className="text-gray-600 font-semibold text-lg">Arrastra el banner aquí</p>
                    <p className="text-gray-400 text-sm">Formato sugerido: 1200x400px (Máx. 5MB)</p>
                  </div>
                </Upload.Dragger>
              )}
            </div>
          </div>

          {/* TABLA DE PRODUCTOS */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1e2939]">Productos Seleccionados</h3>
              <Button
                type="primary"
                className="bg-[#0081B4] h-11 px-6 sm:px-8 rounded-lg font-semibold shadow-sm w-full sm:w-auto"
                onClick={() => setIsModalOpen(true)}
              >
                Modificar Productos
              </Button>
            </div>

            {/* Versión desktop - Tabla */}
            <div className="hidden md:block">
              <DataTable
                rowKey="id_producto"
                columns={columns}
                dataSource={productosSeleccionados}
                className="mt-2"
                emptyMessage="No hay productos seleccionados"
              />
            </div>

            {/* Versión móvil - Tarjetas */}
            <div className="md:hidden flex flex-col gap-3">
              {productosSeleccionados.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
                  <p className="text-gray-500 text-sm">No hay productos seleccionados</p>
                </div>
              ) : (
                productosSeleccionados.map((producto) => {
                  const tieneDescuento = producto.descuento > 0;
                  const precioPromo = producto.precioPromocion ?? producto.precio;
                  const subtotal = Math.round((producto.precio * (1 - producto.descuento / 100)) * 100) / 100;
                  const totalConIsv = Math.round((subtotal * 1.15) * 100) / 100;

                  return (
                    <div
                      key={producto.id_producto}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800">{producto.nombre}</div>
                          <div className="text-xs text-slate-500 mt-1">Código: {producto.id_producto}</div>
                          <div className="text-xs text-slate-500">Stock: {producto.stock}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Vista previa</div>
                          {tieneDescuento && producto.precio > precioPromo ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-gray-400 line-through">L. {formatPrice(producto.precio)}</span>
                              <span className="text-base font-bold text-[#00a65a]">L. {formatPrice(precioPromo)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin descuento</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3">
                        <div className="text-slate-500">Subtotal</div>
                        <div className="text-slate-700 text-right">
                          L. {formatPrice(producto.precio)}
                        </div>

                        <div className="text-slate-500">Descuento</div>
                        <div className="text-slate-700 text-right">
                          L. {formatPrice(Math.round((producto.precio * producto.descuento / 100) * 100) / 100)}
                        </div>

                        <div className="text-slate-500">ISV (15%)</div>
                        <div className="text-slate-700 text-right">
                          L. {formatPrice(Math.round((subtotal * 0.15) * 100) / 100)}
                        </div>

                        <div className="text-slate-500 font-semibold">Total</div>
                        <div className="text-slate-700 text-right font-bold">
                          L. {formatPrice(totalConIsv)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="bg-gray-50 px-6 py-6 border-t border-gray-200 flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto h-12 px-12 rounded-lg font-bold border-2 border-gray-300 text-gray-600 order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            className="w-full sm:w-auto h-12 px-12 rounded-lg font-bold bg-[#0081B4] hover:bg-[#006a94] order-1 sm:order-2"
            onClick={handleConfirmar}
            loading={loading}
          >
            Confirmar
          </Button>
        </div>
      </div>

      <ModificarProductosModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        productosIniciales={productosSeleccionados}
        onSave={(productos) => {
          setProductosSeleccionados(productos);
          setIsModalOpen(false);
        }}
      />
    </div>
  </ConfigProvider>
  );
}