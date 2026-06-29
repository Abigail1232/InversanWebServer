//La descripcion del producto
interface Props {
  description: string;
  //features: string[];
  //closing?: string;
}

export default function ProductDescription({ description /*,features, closing*/ }: Props) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-6 flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-[#1a1a1a]">Descripción</h2>
      <div className="flex flex-col gap-4 text-base text-[#4a4a4a] leading-relaxed">
        <p>{description}</p>
        {/*Esto no se maneja en el protitipo de crear producto de esta manera, asi que por el momento no se implementaria*/}
        {/**/}
        {/*features.length > 0 && (
          <div className="flex flex-col gap-2">
            <p>Características principales:</p>
            <ul className="list-disc pl-8 space-y-1">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        )*/}

        {/*closing && <p>{closing}</p>*/}
      </div>
    </div>
  );
}
