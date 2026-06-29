import { Modal, Select, InputNumber } from "antd";
import { Button } from "../../components/Button";
import type { ProductoOption } from "../../api/admin/stockEntries";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  productosOptions: ProductoOption[];
  selectedProduct: number | undefined;
  onProductChange: (value: number | undefined) => void;
  cantidad: number | null;
  onCantidadChange: (value: number | null) => void;
  costoUnitario: number | null;
  onCostoUnitarioChange: (value: number | null) => void;
  tipoMovimiento: "incremento" | "decremento";
  addProductToDraft: () => void;
  currentSucursalName?: string;
  currentAlmacenId?: number;
}

export function AddProductModal({
  open,
  onClose,
  productosOptions,
  selectedProduct,
  onProductChange,
  cantidad,
  onCantidadChange,
  costoUnitario,
  onCostoUnitarioChange,
  tipoMovimiento,
  addProductToDraft,
  currentSucursalName,
  currentAlmacenId,
}: AddProductModalProps) {
  const selectedProductData = selectedProduct ? productosOptions.find(p => p.id_producto === selectedProduct) : null;

  // Calcular stock en bodega específica y stock total
  const stockEnBodega = selectedProductData?.stock_bodega?.find(sb => Number(sb.id_bodega) === Number(currentAlmacenId))?.existencias ?? 0;
  const stockTotal = selectedProductData?.stock_bodega?.reduce((acc, sb) => acc + sb.existencias, 0) ?? 0;

  return (
    <Modal
      title={
        <span className="text-[28px] font-semibold text-[#1F2937]">
          Gestionar Movimiento de Inventario
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={760}
      destroyOnClose
    >
      <div className="mt-6 flex flex-col gap-5">
        {selectedProduct && (
          <div className="flex flex-col gap-2">
            <div className="rounded-[12px] bg-[#F0F9FF] border border-[#B9E6FE] p-4 flex items-center justify-between">
              <span className="text-[#0369A1] font-medium text-sm">Existencias en almacén seleccionado:</span>
              <span className="text-[#0369A1] font-bold text-lg">{stockEnBodega} uds</span>
            </div>
            {currentAlmacenId && (
              <div className="px-4 flex items-center justify-between text-[13px]">
                <span className="text-[#6B7280]">Total global (todas las bodegas):</span>
                <span className="text-[#374151] font-semibold">{stockTotal} uds</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[15px] font-medium text-[#374151]">
              Tipo de Movimiento
            </label>
            <Select
              className="w-full"
              value={tipoMovimiento}
              disabled={true} // Deshabilitado para evitar conflictos entre páginas
              options={[
                { value: "incremento", label: "Incremento (Entrada)" },
                { value: "decremento", label: "Decremento (Salida/Descuento)" },
              ]}
              size="large"
            />
          </div>

          <div>
            <label className="mb-2 block text-[15px] font-medium text-[#374151]">
              Producto
            </label>
            <Select
              showSearch
              optionFilterProp="label"
              className="w-full"
              placeholder="Selecciona o escribe para filtrar"
              value={selectedProduct}
              onChange={(value) => onProductChange(value as number | undefined)}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={productosOptions.map((producto) => ({
                value: producto.id_producto,
                label: `${producto.nombre} - ${producto.marca?.nombre ?? "Sin marca"}`,
              }))}
              size="large"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[15px] font-medium text-[#374151]">
              Cantidad
            </label>
            <InputNumber
              className="w-full"
              min={1}
              precision={0}
              value={cantidad}
              onChange={(value) => onCantidadChange(typeof value === "number" ? value : null)}
              placeholder="Ingresa la cantidad"
              size="large"
            />
          </div>

        {tipoMovimiento === "incremento" && (
          <div>
            <label className="mb-2 block text-[15px] font-medium text-[#374151]">
              Costo unitario del producto
            </label>
            <InputNumber
              className="w-full"
              min={0.01}
              step={0.01}
              precision={2}
              value={costoUnitario}
              onChange={(value) => onCostoUnitarioChange(typeof value === "number" ? value : null)}
              placeholder="Ingresa el costo unitario"
              size="large"
            />
          </div>
        )}
        </div>
        {currentSucursalName ? (
          <div className="rounded-[12px] border border-[#D1D5DB] bg-[#F8FAFC] p-4 text-sm text-[#374151]">
            El ingreso actual se está registrando para la sucursal: <strong>{currentSucursalName}</strong>.
            Solo puedes agregar productos hacia bodegas de esa misma sucursal.
          </div>
        ) : null}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-4 pt-4 w-full">
          <Button
            variant="primary"
            onClick={addProductToDraft}
            className="
              w-full sm:w-auto
              h-11 sm:h-12
              rounded-xl sm:rounded-2xl
              font-semibold
              text-sm sm:text-base
            "
          >
            Agregar
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="
              w-full sm:w-auto
              h-11 sm:h-12
              rounded-xl sm:rounded-2xl
              border-2 border-[#0284C7]
              bg-white text-[#0284C7]
              font-semibold
              text-sm sm:text-base
            "
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
