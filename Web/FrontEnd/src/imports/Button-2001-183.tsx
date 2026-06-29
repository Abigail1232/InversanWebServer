function Paragraph() {
  return (
    <div className="absolute h-[23.997px] left-[24px] top-[11.99px] w-[105.82px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Arimo:Bold',sans-serif] font-bold leading-[24px] left-[53px] text-[16px] text-center text-white top-[-0.5px]">Primary Button</p>
    </div>
  );
}

export default function Button() {
  return (
    <div className="bg-gradient-to-b from-[#027eb1] relative rounded-[10px] size-full to-[#003e7b]" data-name="Button">
      <Paragraph />
    </div>
  );
}