//para usar este componente simplemente se le pasaria el porcetaje y ya aunque no se si los vamos a poner o no
interface Props {
  percent: number;
}

export default function DiscountBadge({ percent }: Props) {
  return (
    <span className="inline-flex items-center !bg-[#d61216] text-white text-sm font-medium px-2 py-0.5 rounded">
      -{percent}%
    </span>
  );
}
