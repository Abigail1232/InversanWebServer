import { Card, Input, Select, Button, DatePicker } from "antd";
import { FilterX, Search, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import dayjs from "dayjs";


export interface AdvancedFiltersDeliveryValues {
  search: string;
  fecha: string;
  fechaEntrega: string;
  estado: string;
  tipoPago: string;
  repartidor: number | null;
  sucursal: string;
}

const DEFAULT_FILTERS: AdvancedFiltersDeliveryValues = {
  search: "",
  fecha: "Todos",
  fechaEntrega: "Todos",
  estado: "Todos",
  tipoPago: "Todos",
  repartidor: null,
  sucursal: "todos",
};

export interface AdvancedFiltersDeliveryProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  values: AdvancedFiltersDeliveryValues;
  onValuesChange: (values: AdvancedFiltersDeliveryValues) => void;
  onApply: () => void;
  onClear: () => void;
  className?: string;
  repartidores?: { id: number; name: string }[];
  canSeeAll?: boolean;
}

export function AdvancedFiltersDelivery({
  open = true,
  values,
  onValuesChange,
  onApply,
  onClear,
  repartidores = [],
  canSeeAll = false,
}: AdvancedFiltersDeliveryProps) {
  const [localSearch, setLocalSearch] = useState(values.search);

  // Update local search when values change from outside
  useEffect(() => {
    setLocalSearch(values.search);
  }, [values.search]);

  // Apply filters when values change (but not on initial render)
  useEffect(() => {
    const timer = setTimeout(() => {
      onApply();
    }, 100);

    return () => clearTimeout(timer);
  }, [values.estado, values.tipoPago, values.fecha, values.fechaEntrega, values.repartidor]); // Removed values.search and values.sucursal (branch filtering handled by global selector)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setLocalSearch(searchValue);
    const newValues = { ...values, search: searchValue };
    onValuesChange(newValues);
    // Apply search immediately for better UX
    setTimeout(() => onApply(), 50);
  };

  const handleDateChange = (date: any) => {
    onValuesChange({
      ...values,
      // Enviamos el día exacto, pero le indicamos al padre que maneje el rango
      fecha: date ? date.format("YYYY-MM-DD") : "Todos",
    });
  };

  const handleDateEntregaChange = (date: any) => {
    onValuesChange({
      ...values,
      fechaEntrega: date ? date.format("YYYY-MM-DD") : "Todos",
    });
  };

  const handleEstadoChange = (v: string) => {
    const newValues = { ...values, estado: v };
    onValuesChange(newValues);
    // Filter will be applied by the useEffect
  };

  const handleTipoPagoChange = (v: string) => {
    const newValues = { ...values, tipoPago: v };
    onValuesChange(newValues);
  };

  const handleRepartidorChange = (v: number | null) => {
    const newValues = { ...values, repartidor: v };
    onValuesChange(newValues);
  };



  const handleClear = () => {
    onValuesChange(DEFAULT_FILTERS);
    setLocalSearch("");
    onClear();
  };

  if (!open) {
    return null;
  }

  return (
    <Card className="rounded-3xl border-2 shadow-xs mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        {/* Campo de búsqueda */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-[11px] font-bold uppercase">
            Buscar
          </label>
          <Input
            placeholder="Buscar por Usuario, Nombre, Teléfono..."
            prefix={<Search size={18} className="text-gray-300 mr-2" />}
            className="h-12 rounded-xl bg-gray-50 border-gray-100"
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-[11px] font-bold uppercase">
            Fecha de Pedido
          </label>
          <DatePicker
            className="h-12 rounded-xl bg-gray-50 border-gray-100 w-full"
            // Si values.fecha es "Todos", el valor es null, si no, lo convertimos a dayjs
            value={values.fecha !== "Todos" ? dayjs(values.fecha) : null}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            placeholder="Seleccionar Fecha"
            suffixIcon={<Calendar size={18} className="text-gray-300" />}
            allowClear
          />
        </div>

        {/* Fecha de entrega */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-[11px] font-bold uppercase">
            Fecha de Entrega
          </label>
          <DatePicker
            className="h-12 rounded-xl bg-gray-50 border-gray-100 w-full"
            value={values.fechaEntrega !== "Todos" ? dayjs(values.fechaEntrega) : null}
            onChange={handleDateEntregaChange}
            format="DD/MM/YYYY"
            placeholder="Seleccionar Fecha"
            suffixIcon={<Calendar size={18} className="text-gray-300" />}
            allowClear
          />
        </div>
        {/* Estado */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-[11px] font-bold uppercase">
            Estado
          </label>
          <Select
            className="h-12 rounded-xl w-full"
            value={values.estado}
            onChange={handleEstadoChange}
          >
            <Select.Option value="Todos">Todos</Select.Option>
            <Select.Option value="Entregado">Entregado</Select.Option>
            <Select.Option value="En proceso">En proceso</Select.Option>
            <Select.Option value="Pendiente">Pendiente</Select.Option>
            <Select.Option value="Cancelado">Cancelado</Select.Option>
          </Select>
        </div>

        {/* Tipo de Pago */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-[11px] font-bold uppercase">
            Tipo de Pago
          </label>
          <Select
            className="h-12 rounded-xl w-full"
            value={values.tipoPago}
            onChange={handleTipoPagoChange}
          >
            <Select.Option value="Todos">Todos</Select.Option>
            <Select.Option value="efectivo">Efectivo</Select.Option>
            <Select.Option value="transferencia_bancaria">
              Transferencia
            </Select.Option>
            <Select.Option value="pos">POS</Select.Option>
            <Select.Option value="pay_pal">PayPal</Select.Option>
          </Select>
        </div>


        {/* Repartidor (solo si puede ver todos) */}
        {canSeeAll && (
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-[11px] font-bold uppercase">
              Repartidor
            </label>
            <Select
              className="h-12 rounded-xl w-full"
              value={values.repartidor}
              onChange={handleRepartidorChange}
            >
              <Select.Option value={null}>Todos</Select.Option>
              {repartidores.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button
          type="text"
          danger
          className="flex items-center gap-1 font-bold"
          onClick={handleClear}
        >
          <FilterX className="w-5 h-5 text-red-500 " />
          Limpiar Filtros
        </Button>
      </div>
    </Card>
  );
}

export { DEFAULT_FILTERS };
