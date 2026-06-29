//este componente es el selector de cantidad,
//en caso de querer un max cargarlo ponerlo en las props como ultimo atributo
interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({ value, onChange, min = 1, max }: Props) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  
  const increment = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-4">
      
      <span className="text-base text-[#4a4a4a]">Cantidad:</span>

      <div className="flex items-center border border-[#e5e7eb] rounded-[10px] h-[34px] overflow-hidden">
       
        {/*El boton de decrmentar  la cantidad*/}
        <button
          onClick={decrement}
          disabled={value <= min}
          className="w-8 h-full flex items-center justify-center text-[#4a4a4a] hover:bg-gray-50 disabled:opacity-40 transition-colors border-0 bg-transparent p-0"
          aria-label="Disminuir cantidad"
        >
          <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="1" x2="14" y2="1" stroke="#4a4a4a" strokeWidth="1.5" />
          </svg>
        </button>

        {/*El valor del centro*/}
        <span className="w-10 text-center text-base font-medium text-[#0a0a0a] select-none">
          {value}
        </span>

        {/*El boton de incrementar la cantidad*/}
        <button
          onClick={increment}
          disabled={max !== undefined && value >= max}
          className="w-8 h-full flex items-center justify-center text-[#4a4a4a] hover:bg-gray-50 disabled:opacity-40 transition-colors border-0 bg-transparent p-0"
          aria-label="Aumentar cantidad"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="7" x2="14" y2="7" stroke="#4a4a4a" strokeWidth="1.5" />
            <line x1="7" y1="0" x2="7" y2="14" stroke="#4a4a4a" strokeWidth="1.5" />
          </svg>
        </button>

      </div>
    </div>
  );
}
