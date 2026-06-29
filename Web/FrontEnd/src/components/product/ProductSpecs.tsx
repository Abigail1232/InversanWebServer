import type { ProductSpec } from "../../types/product";
//esta es la parte de las ficha tecnicas, se meten todas en un arreglo porque llevan el mismo formato
interface Props {
  specs: ProductSpec[];
}

function formatSpecValue(spec: ProductSpec): string {
  const base = spec.value;
  if (base === "N/A" || base === "Sin perfil") return base;

  switch (spec.label) {
    case "Lona":
      return `${base} PR`;
    case "Presión Máxima":
      return `${base} psi`;
    case "Rin":
      return `${base} pulgadas`;
    case "Profundidad":
      return `${base} mm`;
    default:
      return base;
  }
}

export default function ProductSpecs({ specs }: Props) {
  return (
    <div className="bg-[#f3f4f6] rounded-[10px] flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-[#1a1a1a]">Ficha Técnica</h3>

      <div className="mt-1 w-full overflow-hidden rounded-[8px] border border-[#d1d5db] bg-white shadow-md">
        {/* Encabezados - Proporción 1.2 a 1.8 para simetría total */}
        <div className="grid grid-cols-[1.2fr_1.8fr] bg-[#003E7B] text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
          <div className="px-3 py-2 border-r border-white/20 truncate">
            Especificación
          </div>
          <div className="px-3 py-2">Valor</div>
        </div>

        {/* Filas - Misma proporción que el header */}
        <div className="divide-y divide-[#e5e7eb]">
          {specs.map((spec) => (
            <div key={spec.label} className="grid grid-cols-[1.2fr_1.8fr]">
              <div className="px-3 py-2 bg-[#f3f4f6] text-xs sm:text-sm font-semibold text-[#374151] border-r border-[#e5e7eb] break-words">
                {spec.label}
              </div>
              <div className="px-3 py-2 text-xs sm:text-sm text-[#111827] break-words">
                {formatSpecValue(spec)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
