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

const DRAFT_STORAGE_KEY_DECREMENT = "admin_stock_decrement_draft";

export default function AdminStockDecrement() {
  const [productosOptions, setProductosOptions] = useState<ProductoOption[]>(
    [],
  );
  const [bodegasOptions, setBodegasOptions] = useState<BodegaOption[]>([]);

  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const [cantidad, setCantidad] = useState<number | null>(1);
  const [costoUnitario, setCostoUnitario] = useState<number | null>(null);
  const [tipoMovimiento] = useState<"incremento" | "decremento">("decremento");
  const [selectedSucursal, setSelectedSucursal] = useState<string | undefined>();
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | undefined>();
  const [observaciones, setObservaciones] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);


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
    localStorage.setItem(DRAFT_STORAGE_KEY_DECREMENT, JSON.stringify(draft));
  };

  const clearDraftFromStorage = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY_DECREMENT);
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
  };

  const openAddProductModal = () => {
    resetModalFields();
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
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY_DECREMENT);

    if (savedDraft) {
      try {
        const parsed: DraftIngreso = JSON.parse(savedDraft);
        setDraftProducts(parsed.productos || []);
        setObservaciones(parsed.observaciones || "");
        if (parsed.productos?.length > 0) {
          setSelectedSucursal(parsed.productos[0].sucursal_nombre);
          setSelectedAlmacen(parsed.productos[0].id_bodega);
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

    const proveedorFinal = "Ajuste de Inventario";

    const selectedSucursalName = currentSucursalName;

    if (!selectedSucursalName) {
      message.warning("Debes seleccionar la sucursal origen");
      return;
    }

    if (!selectedAlmacen) {
      message.warning("Debes seleccionar el almacén origen");
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

    // Validación de stock para decrementos considerando lo ya añadido al borrador
    const stockItem = producto.stock_bodega?.find(s => Number(s.id_bodega) === Number(selectedAlmacen));
    const existenciasSistema = stockItem?.existencias || 0;
    
    // Calcular cuánto se ha descontado de este producto y bodega en el borrador actual
    const yaDescontadoEnBorrador = draftProducts
      .filter(item => item.id_producto === producto.id_producto && item.id_bodega === bodega.id_bodega)
      .reduce((sum, item) => sum + item.cantidad, 0);

    const existenciasDisponiblesReales = existenciasSistema - yaDescontadoEnBorrador;
    
    if (cantidad > existenciasDisponiblesReales) {
      if (yaDescontadoEnBorrador > 0) {
        message.error(`No puedes retirar más de lo que hay. Existencias en sistema: ${existenciasSistema}, ya tienes ${yaDescontadoEnBorrador} en la lista. Disponible restante: ${existenciasDisponiblesReales}`);
      } else {
        message.error(`No puedes retirar más de lo que hay. Existencias actuales en este almacén: ${existenciasSistema}`);
      }
      return;
    }

    const bodegaSucursal = bodega.sucursal?.nombre ?? "Sin sucursal";

    if (
      draftProducts.length > 0 &&
      draftProducts[0].sucursal_nombre !== bodegaSucursal
    ) {
      message.warning(
        "El decremento debe registrarse para una sola sucursal. Selecciona una bodega de la misma sucursal.",
      );
      return;
    }

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
        costo_total: 0,
        costo_unitario: 0,
        accion: "decremento",
      },
    ];

    setDraftProducts(updatedProducts);
    closeAddProductModal();
    message.success("Producto agregado al decremento en proceso");
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

    const payload: CreateIngresoPayload = {
      observaciones: observaciones.trim(),
      productos: draftProducts.map((item) => ({
        id_producto: item.id_producto,
        cantidad: Number(item.cantidad),
        costo_unitario: 0,
        proveedor: "Ajuste de Inventario",
        id_bodega: item.id_bodega,
        accion: "decremento",
      })),
    };

    try {
      setLoading(true);

      await createIngreso(payload);

      message.success("Decremento registrado correctamente");

      // Limpiar todos los campos del formulario
      setDraftProducts([]);
      setSelectedSucursal(undefined);
      setSelectedAlmacen(undefined);
      setObservaciones("");
      resetModalFields();
      clearDraftFromStorage();

      await loadData();
    } catch (error) {
      console.error("Error al registrar decremento:", error);
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
            Administración de Decrementos de Inventario
          </h1>
          <p className="text-[#6B7280] mt-1 text-[16px]">
            Gestión y control de salidas de inventario
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
            <p className="text-[#6B7280] text-sm mb-1">Total de unidades a retirar</p>
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
                  Datos del Decremento
                </span>
              }
              key="1"
              className="border-none"
            >
              <div className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Sucursal */}
                  <div>
                    <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                      Sucursal origen
                    </label>
                    <Select
                      showSearch
                      disabled={hasDraft}
                      allowClear={!hasDraft}
                      placeholder="Selecciona la sucursal origen"
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
                      Almacén origen
                    </label>
                    <Select
                      showSearch
                      disabled={!selectedSucursal || hasDraft}
                      allowClear={!hasDraft}
                      placeholder={
                        selectedSucursal
                          ? "Selecciona el almacén origen"
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
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="mb-2 block text-[15px] font-medium text-[#374151]">
                    Motivo o Observaciones
                  </label>
                  <Input.TextArea
                    rows={4}
                    value={observaciones}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObservaciones(e.target.value)}
                    placeholder="Describe el motivo de la salida de inventario"
                    className="!rounded-[12px]"
                  />
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={openAddProductModal}
              className="!h-12 !rounded-[12px] !border-2 !border-[#EF4444] !text-[#EF4444] !bg-white !font-semibold !w-full sm:!w-auto"
            >
              Añadir Decremento de Producto
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              className="!h-12 !rounded-[12px] !font-semibold !w-full sm:!w-auto !bg-[#EF4444] !border-[#EF4444]"
              disabled={loading}
            >
              Confirmar Salidas
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#D9E0E8] overflow-hidden shadow-sm p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              Productos a retirar en proceso
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Aquí se muestran los productos que se descontarán del inventario.
            </p>
          </div>
          {hasDraft ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftProducts.map((item) => (
                <div key={item.localId} className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#6B7280] mb-1">Producto</p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                            Salida
                          </span>
                        </div>
                        <p className="font-semibold text-[#111827] text-sm leading-tight line-clamp-2">{item.nombre_producto}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 whitespace-nowrap">
                          -{item.cantidad} uds
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDraftProduct(item.localId)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors p-1 hover:bg-red-50 rounded"
                        >
                          <DeleteOutlined className="text-sm" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280]">Bodega:</span>
                        <span className="text-xs font-medium text-[#111827]">{item.nombre_bodega}</span>
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
                  No hay productos para descontar
                </p>
                <Button
                  variant="secondary"
                  onClick={openAddProductModal}
                  className="!h-12 !rounded-[12px] !border-2 !border-[#EF4444] !text-[#EF4444] !bg-white !font-semibold"
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
        currentSucursalName={selectedSucursal}
        currentAlmacenId={selectedAlmacen}
      />
    </div>
  </ConfigProvider>
  );
}
