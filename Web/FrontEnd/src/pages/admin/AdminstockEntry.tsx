import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Input, Select, message, Collapse,ConfigProvider } from "antd";
import { DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { Button } from "../../components/Button";
import { AddProductModal } from "./AdminstockEntryModal";
import {
  createIngreso,
  getBodegasOptions,
  getProductosOptions,
  type BodegaOption,
  type ProductoOption,
  type CreateIngresoPayload,
} from "../../api/admin/stockEntries";

interface DraftProduct {
  localId: number;
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  proveedor: string;
  id_bodega: number;
  nombre_bodega: string;
  sucursal_nombre: string;
  costo_total: number;
  costo_unitario: number;
  accion: "incremento" | "decremento";
}

interface DraftIngreso {
  observaciones: string;
  productos: DraftProduct[];
}

const DRAFT_STORAGE_KEY = "admin_stock_entry_draft";

export default function AdminStockEntry() {
  const [productosOptions, setProductosOptions] = useState<ProductoOption[]>(
    [],
  );
  const [bodegasOptions, setBodegasOptions] = useState<BodegaOption[]>([]);

  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const [cantidad, setCantidad] = useState<number | null>(1);
  const [costoUnitario, setCostoUnitario] = useState<number | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<"incremento" | "decremento">("incremento");
  const [proveedor, setProveedor] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState<string | undefined>();
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | undefined>();
  const [observaciones, setObservaciones] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);


  const formatLempiras = (value: number) => {
    return `Lps. ${Number(value || 0).toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "object" && error !== null) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
            details?: string;
          };
        };
        message?: string;
      };

      return (
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        "Ocurrió un error inesperado"
      );
    }

    return "Ocurrió un error inesperado";
  };

  const saveDraftToStorage = (draft: DraftIngreso) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  };

  const clearDraftFromStorage = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const syncDraftToStorage = (
    products: DraftProduct[],
    currentObservaciones?: string,
  ) => {
    saveDraftToStorage({
      productos: products,
      observaciones: currentObservaciones ?? observaciones,
    });
  };

  const resetModalFields = () => {
    setSelectedProduct(undefined);
    setCantidad(1);
    setCostoUnitario(null);
    setTipoMovimiento("incremento");
  };

  const openAddProductModal = (tipo: "incremento" | "decremento") => {
    resetModalFields();
    setTipoMovimiento(tipo);
    setOpenModal(true);
  };

  const closeAddProductModal = () => {
    resetModalFields();
    setOpenModal(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [productosRes, bodegasRes] = await Promise.all([
        getProductosOptions(),
        getBodegasOptions(),
      ]);

      setProductosOptions(productosRes || []);
      setBodegasOptions(bodegasRes || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

    if (savedDraft) {
      try {
        const parsed: DraftIngreso = JSON.parse(savedDraft);
        setDraftProducts(parsed.productos || []);
        setObservaciones(parsed.observaciones || "");
        if (parsed.productos?.length > 0) {
          setSelectedSucursal(parsed.productos[0].sucursal_nombre);
          setSelectedAlmacen(parsed.productos[0].id_bodega);
          setProveedor(parsed.productos[0].proveedor);
        }
      } catch (error) {
        console.error("Error leyendo borrador guardado:", error);
        clearDraftFromStorage();
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    syncDraftToStorage(draftProducts, observaciones);
  }, [draftProducts, observaciones]);

  const totalUnidades = useMemo(() => {
    return draftProducts.reduce((acc, item) => acc + item.cantidad, 0);
  }, [draftProducts]);

  const currentSucursalName = useMemo(() => {
    return selectedSucursal ?? (draftProducts.length > 0 ? draftProducts[0].sucursal_nombre : undefined);
  }, [selectedSucursal, draftProducts]);

  const sucursalOptions = useMemo(() => {
    const names = new Set<string>();
    bodegasOptions.forEach((bodega) => {
      if (bodega.sucursal?.nombre) {
        names.add(bodega.sucursal.nombre);
      }
    });
    if (selectedSucursal) {
      names.add(selectedSucursal);
    }
    return Array.from(names);
  }, [bodegasOptions, selectedSucursal]);

  const almacenesOptions = useMemo(() => {
    if (!selectedSucursal) return [];

    return bodegasOptions.filter(
      (bodega) => bodega.sucursal?.nombre === selectedSucursal,
    );
  }, [bodegasOptions, selectedSucursal]);

  const addProductToDraft = () => {
    if (!selectedProduct) {
      message.warning("Debes seleccionar un producto");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      message.warning("Debes ingresar una cantidad válida");
      return;
    }

    if (tipoMovimiento === "incremento" && (costoUnitario === null || costoUnitario === undefined || costoUnitario <= 0)) {
      message.warning("Debes ingresar un costo unitario válido para el incremento");
      return;
    }

    if (tipoMovimiento === "incremento" && !proveedor.trim()) {
      message.warning("Debes ingresar el proveedor para el ingreso");
      return;
    }

    const proveedorFinal = tipoMovimiento === "decremento" ? "Ajuste de Inventario" : proveedor.trim();

    const selectedSucursalName = currentSucursalName;

    if (!selectedSucursalName) {
      message.warning("Debes seleccionar la sucursal destino");
      return;
    }

    if (!selectedAlmacen) {
      message.warning("Debes seleccionar el almacén destino");
      return;
    }

    const producto = productosOptions.find(
      (item) => item.id_producto === selectedProduct,
    );
    const bodega = bodegasOptions.find(
      (item) => item.id_bodega === selectedAlmacen,
    );

    if (!producto) {
      message.error("Producto no válido");
      return;
    }

    if (!bodega) {
      message.error("Almacén no válido");
      return;
    }

    // Validación de stock para decrementos
    if (tipoMovimiento === "decremento") {
      const stockItem = producto.stock_bodega?.find(s => s.bodega?.id_bodega === selectedAlmacen);
      const existenciasActuales = stockItem?.existencias || 0;
      
      if (cantidad > existenciasActuales) {
        message.error(`No puedes retirar más de lo que hay. Existencias actuales en este almacén: ${existenciasActuales}`);
        return;
      }
    }

    const bodegaSucursal = bodega.sucursal?.nombre ?? "Sin sucursal";

    if (
      draftProducts.length > 0 &&
      draftProducts[0].sucursal_nombre !== bodegaSucursal
    ) {
      message.warning(
        "El ingreso debe registrarse para una sola sucursal. Selecciona una bodega de la misma sucursal.",
      );
      return;
    }

    const costoUnitarioFinal = tipoMovimiento === "incremento" ? Number(costoUnitario!.toFixed(2)) : 0;
    const costoTotalFinal = tipoMovimiento === "incremento" ? Number((costoUnitarioFinal * cantidad).toFixed(2)) : 0;

    const updatedProducts: DraftProduct[] = [
      ...draftProducts,
      {
        localId: Date.now(),
        id_producto: producto.id_producto,
        nombre_producto: `${producto.nombre} - ${producto.marca?.nombre ?? "Sin marca"}`,
        cantidad,
        proveedor: proveedorFinal,
        id_bodega: bodega.id_bodega,
        nombre_bodega: `${bodega.nombre} - ${bodega.sucursal?.nombre ?? "Sin sucursal"}`,
        sucursal_nombre: bodegaSucursal,
        costo_total: costoTotalFinal,
        costo_unitario: costoUnitarioFinal,
        accion: tipoMovimiento,
      },
    ];

    setDraftProducts(updatedProducts);
    closeAddProductModal();
    message.success("Producto agregado al ingreso en proceso");
  };

  const removeDraftProduct = (localId: number) => {
    const updated = draftProducts.filter((item) => item.localId !== localId);
    setDraftProducts(updated);
  };

  const handleSubmit = async () => {
    if (draftProducts.length === 0) {
      message.warning("Agrega al menos un producto");
      return;
    }

    if (!proveedor.trim()) {
      message.warning("Debes ingresar el proveedor para completar el registro");
      return;
    }

    const payload: CreateIngresoPayload = {
      observaciones: observaciones.trim(),
      productos: draftProducts.map((item) => ({
        id_producto: item.id_producto,
        cantidad: Number(item.cantidad),
        costo_unitario: Number(item.costo_unitario),
        proveedor: proveedor.trim(),
        id_bodega: item.id_bodega,
        accion: item.accion,
      })),
    };

    try {
      setLoading(true);

      await createIngreso(payload);

      message.success("Ingreso registrado correctamente");

      // Limpiar todos los campos del formulario
      setDraftProducts([]);
      setSelectedSucursal(undefined);
      setSelectedAlmacen(undefined);
      setProveedor("");
      setObservaciones("");
      resetModalFields();
      clearDraftFromStorage();

      await loadData();
    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const hasDraft = draftProducts.length > 0;


  return (
  <ConfigProvider>
    <div className="w-full min-h-screen bg-[#F5F7FA] py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
            Administración de Ingresos de Inventario
          </h1>
          <p className="text-[#6B7280] mt-1 text-[16px]">
            Gestión y control de ingresos de inventario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-[16px] px-6 py-5 border border-[#E5E7EB] shadow-sm">
            <p className="text-[#6B7280] text-sm mb-1">Productos en lista</p>
            <span className="text-[36px] leading-none font-semibold text-[#111827]">
              {draftProducts.length}
            </span>
          </div>

          <div className="bg-white rounded-[16px] px-6 py-5 border border-[#E5E7EB] shadow-sm">
            <p className="text-[#6B7280] text-sm mb-1">Total de unidades</p>
            <span className="text-[36px] leading-none font-semibold text-[#111827]">
              {totalUnidades}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <Collapse
            defaultActiveKey={['1']}
            className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm"
          >
            <Collapse.Panel
              header={
                <span className="text-[16px] font-medium text-[#374151]">
                  Datos del Ingreso
                </span>
              }
              key="1"
              className="border-none"
            >
              <div className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Sucursal */}
                  <div>
                    <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                      Sucursal destino
                    </label>
                    <Select
                      showSearch
                      disabled={hasDraft}
                      allowClear={!hasDraft}
                      placeholder="Selecciona la sucursal destino"
                      value={selectedSucursal}
                      className="w-full"
                      onChange={(value) => {
                        const selected = value as string | undefined;
                        setSelectedSucursal(selected);
                        if (selected !== currentSucursalName) {
                          setSelectedAlmacen(undefined);
                        }
                      }}
                      options={sucursalOptions.map((nombre) => ({
                        label: nombre,
                        value: nombre,
                      }))}
                      size="large"
                    />
                  </div>

                  {/* Almacén */}
                  <div>
                    <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                      Almacén destino
                    </label>
                    <Select
                      showSearch
                      disabled={!selectedSucursal || hasDraft}
                      allowClear={!hasDraft}
                      placeholder={
                        selectedSucursal
                          ? "Selecciona el almacén destino"
                          : "Selecciona una sucursal primero"
                      }
                      value={selectedAlmacen}
                      className="w-full"
                      onChange={(value) =>
                        setSelectedAlmacen(value as number | undefined)
                      }
                      options={almacenesOptions.map((bodega) => ({
                        label: `${bodega.nombre}`,
                        value: bodega.id_bodega,
                      }))}
                      size="large"
                    />
                    {!selectedSucursal && (
                      <p className="mt-3 text-sm text-[#6B7280]">
                        Debes seleccionar una sucursal para elegir el almacén.
                      </p>
                    )}
                  </div>

                  {/* Proveedor */}
                  {selectedSucursal && (
                    <div>
                      <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                        Proveedor del ingreso
                      </label>
                      <Input
                        value={proveedor}
                        onChange={(e) => setProveedor(e.target.value)}
                        placeholder="Ej. Proveedor Urbano"
                        size="large"
                        className="w-full"
                      />
                      <p className="mt-3 text-sm text-[#6B7280]">
                        El proveedor es único para todo el ingreso.
                      </p>
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div>
                  <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                    Observaciones
                  </label>
                  <Input.TextArea
                    rows={4}
                    value={observaciones}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                      const value = e.target.value;
                      if (value.length > 200) {
                        message.warning("Las observaciones no pueden exceder 200 caracteres");
                        return;
                      }
                      setObservaciones(value);
                    }}
                    placeholder="Describe el ingreso o notas internas"
                    className="!rounded-[12px]"
                    maxLength={200}
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {observaciones.length}/200 caracteres
                  </div>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => openAddProductModal("incremento")}
              className="!h-12 !rounded-[12px] !border-2 !border-[#0284C7] !text-[#0284C7] !bg-white !font-semibold !w-full sm:!w-auto"
            >
              Añadir Ingreso de Producto
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              className="!h-12 !rounded-[12px] !font-semibold !w-full sm:!w-auto"
              disabled={loading}
            >
              Confirmar Ingresos
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#D9E0E8] overflow-hidden shadow-sm p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              Productos en ingreso en proceso
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Aquí se muestran los productos del ingreso pendiente. Todos los productos deben corresponder a una sola sucursal.
            </p>
          </div>
          {hasDraft ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {draftProducts.map((item) => (
                <div key={item.localId} className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-4">
                    {/* Header con producto y cantidad */}
                      <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#6B7280] mb-1">Producto</p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.accion === 'incremento' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.accion === 'incremento' ? 'Entrada' : 'Salida'}
                          </span>
                        </div>
                        <p className="font-semibold text-[#111827] text-sm leading-tight line-clamp-2">{item.nombre_producto}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#0369A1] whitespace-nowrap">
                          {item.cantidad} uds
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDraftProduct(item.localId)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors p-1 hover:bg-red-50 rounded"
                          title="Eliminar producto"
                        >
                          <DeleteOutlined className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280]">Proveedor:</span>
                        <span className="text-xs font-medium text-[#111827]">{item.proveedor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280]">Bodega:</span>
                        <span className="text-xs font-medium text-[#111827]">{item.nombre_bodega}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280]">Costo unitario:</span>
                        <span className="text-xs font-medium text-[#111827]">{formatLempiras(item.costo_unitario)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                        <span className="text-sm font-semibold text-[#111827]">Total:</span>
                        <span className="text-sm font-bold text-[#0284C7]">{formatLempiras(item.costo_total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-20">
              <div className="flex flex-col items-center justify-center text-center">
                <InboxOutlined className="text-[48px] text-[#C5D0DD] mb-4" />
                <p className="text-[#7C8CA0] text-[20px] mb-5">
                  No hay productos agregados
                </p>
                <Button
                  variant="secondary"
                  onClick={() => openAddProductModal("incremento")}
                  className="!h-12 !rounded-[12px] !border-2 !border-[#0284C7] !text-[#0284C7] !bg-white !font-semibold"
                >
                  + Agregar Primer Producto
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      <AddProductModal
        open={openModal}
        onClose={closeAddProductModal}
        productosOptions={productosOptions}
        selectedProduct={selectedProduct}
        onProductChange={(value) => setSelectedProduct(value)}
        cantidad={cantidad}
        onCantidadChange={(value) => setCantidad(value)}
        costoUnitario={costoUnitario}
        onCostoUnitarioChange={(value) => setCostoUnitario(value)}
        tipoMovimiento={tipoMovimiento}
        addProductToDraft={addProductToDraft}
        currentSucursalName={currentSucursalName}
        currentAlmacenId={selectedAlmacen}
      />
    </div>
  </ConfigProvider>
  );
}
