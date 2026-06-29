import { useState, useRef, useEffect } from "react";
import { FilterX, Search, ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { DatePicker, ConfigProvider } from "antd";
import esES from "antd/lib/locale/es_ES";
import type { Dayjs } from "dayjs";

export interface FilterSelectOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterSelectConfig {
  placeholder?: string;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean | undefined) => void;
  options: FilterSelectOption[];
  className?: string;
}

export interface DateFilterConfig {
  placeholder?: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  className?: string;
}

export interface FilterBarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: FilterSelectConfig[];
  fechaInicio?: DateFilterConfig;
  fechaFin?: DateFilterConfig;
  onClear?: () => void;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
}

const inputClass =
  "h-11 w-full rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:outline-none pl-10 pr-3 text-slate-700 placeholder:text-slate-400 text-sm";

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Filtrar",
}: {
  value: string | number | undefined | boolean;
  onChange: (v: string | number | boolean | undefined) => void;
  options: FilterSelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value !== undefined && value !== "" ? options.find((o) => o.value === value) : null;
  const label = selected ? selected.label : placeholder;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onOutside);
      return () => document.removeEventListener("mousedown", onOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-11 w-full rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1] focus:border-[#027EB1] focus:outline-none px-3 pr-10 text-left text-slate-700 text-sm flex items-center"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#D7E3F0] bg-white shadow-md py-1 min-w-0 left-0 right-0">
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-[#EAF7FD] hover:text-[#027EB1] transition-colors"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${opt.value === value ? "bg-[#EAF7FD] text-[#027EB1] font-medium" : "text-slate-700 hover:bg-slate-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  search,
  filters = [],
  fechaInicio,
  fechaFin,
  onClear,
  collapsible = false,
  open = true,
  onOpenChange,
  children,
  className = "",
}: FilterBarProps) {
  const hasContent = search || filters.length > 0 || fechaInicio || fechaFin || onClear;
  const showPanel = !collapsible || open;
  const renderPanelHere = hasContent && showPanel;

  return (
    <ConfigProvider locale={esES}>
      <div className={className}>
        {(collapsible && hasContent) ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:items-center lg:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange?.(!open)}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[#B8E3F6] bg-[#EAF7FD] text-[#027EB1] hover:border-[#027EB1] hover:bg-[#D9F0FB] transition-colors"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {open ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            {children}
          </div>
        ) : null}

        {renderPanelHere && (
          <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center">
                    
            {/* IZQUIERDA */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {search && (
                <div className="min-w-[200px] flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#027EB1]" />
                    <input
                      type="text"
                      value={search.value}
                      onChange={(e) => search.onChange(e.target.value)}
                      placeholder={search.placeholder ?? "Buscar..."}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
          
              {filters.map((f, i) => (
                <div key={i} className="min-w-[150px] flex-1 sm:flex-none">
                  <CustomSelect
                    value={f.value}
                    onChange={f.onChange}
                    options={f.options}
                    placeholder={f.placeholder ?? "Filtrar"}
                  />
                </div>
              ))}
          
              {fechaInicio && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desde:</span>
                  <DatePicker
                    value={fechaInicio.value}
                    onChange={fechaInicio.onChange}
                    placeholder="Inicio"
                    className="h-11 min-w-[140px]"
                  />
                </div>
              )}
          
              {fechaFin && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta:</span>
                  <DatePicker
                    value={fechaFin.value}
                    onChange={fechaFin.onChange}
                    placeholder="Fin"
                    className="h-11 min-w-[140px]"
                  />
                </div>
              )}
            </div>
            
            {/* DERECHA */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  title="Limpiar filtros"
                  className="flex items-center justify-center h-11 min-w-[44px] rounded-xl border-2 border-[#D7E3F0] bg-white text-slate-600 hover:text-[#D61216] hover:border-[#D61216] transition-all group"
                >
                  <FilterX className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
          
              {children}
            </div>
            
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}

export interface FilterBarPanelProps {
  open: boolean;
  search?: FilterBarProps["search"];
  filters?: FilterSelectConfig[];
  onClear?: () => void;
  className?: string;
}

export function FilterBarPanel({
  open,
  search,
  filters = [],
  onClear,
  className = "",
}: FilterBarPanelProps) {
  if (!open) return null;
  const hasContent = search || filters.length > 0 || onClear;
  if (!hasContent) return null;
  return (
    <div className={`mt-5 w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {search && (
          <div className={filters.length > 0 ? "lg:col-span-3" : onClear ? "lg:col-span-11" : "lg:col-span-12"}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#027EB1] pointer-events-none" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? "Buscar..."}
                className={inputClass}
              />
            </div>
          </div>
        )}
        {filters.length > 0 && (
          <div className="flex gap-3 lg:col-span-5">
            {filters.map((f, i) => (
              <div key={i} className="flex-1 min-w-0">
                <CustomSelect
                  value={f.value}
                  onChange={f.onChange}
                  options={f.options}
                  placeholder={f.placeholder ?? "Filtrar"}
                />
              </div>
            ))}
          </div>
        )}
        {onClear && (
          <div className="lg:col-span-1 flex items-center">
            <button
              type="button"
              onClick={onClear}
              title="Limpiar filtros"
              className="flex items-center justify-center h-11 min-w-[44px] rounded-xl border-2 border-[#D7E3F0] bg-white text-slate-600 hover:text-[#D61216] hover:border-[#D61216] transition-all group"
            >
              <FilterX className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
