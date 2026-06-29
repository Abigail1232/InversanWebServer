export default function TextInput() {
  return (
    <div className="relative rounded-[10px] size-full" data-name="Text Input">
      <div className="content-stretch flex items-center overflow-clip px-[16px] relative rounded-[inherit] size-full">
        <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-[rgba(26,26,26,0.5)]">Input enfocado</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#027eb1] border-[0.833px] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}