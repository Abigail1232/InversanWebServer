interface WholesaleBannerProps {
  isWholesaleClient: boolean;
}

export default function WholesaleBanner({ isWholesaleClient }: WholesaleBannerProps) {
  if (!isWholesaleClient) return null;
  return (
    <div className="flex gap-3 bg-[#dbeafe] border border-[#60a5fa] rounded-[10px] p-4">
      <div className="flex-shrink-0 mt-0.5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="#2563eb" strokeWidth="2" />
          <path d="M10 9v5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="6.5" r="1" fill="#2563eb" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-[#2563eb]">Mayoreo Incluido</p>
        <p className="text-sm text-[#1d4ed8] leading-snug">
          Debido a sus permisos, se le ofrece el precio de mayoreo del producto.{' '}
          El cambio del precio se reflejara en{' '}
          <span className="font-bold">Finalización de Compra</span> como descuento.
        </p>
      </div>
    </div>
  );
}
