import React, { useState, useEffect } from "react";
import { Upload, X, ChevronDown } from "lucide-react";

interface Brand {
    id: number;
    name: string;
    logo: string;
    banner?: string;
    productCount: number;
    active: boolean;
}

interface BrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    brand?: Brand | null;
    onSave: (payload: {
        nombre: string;
        logo: File | null;
        banner: File | null;
        activo: boolean;
    }) => Promise<void>;
}

function FilterDropdown({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
}) {
    return (
        <div className="relative min-w-[220px]">
            <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none z-10"
                fill="none"
                viewBox="0 0 20 20"
            >
                <path
                    d="M4 5h12l-4.5 5.25V15l-3-1.5v-3.25L4 5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-[46px] pl-11 pr-10 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] appearance-none cursor-pointer hover:border-[#027eb1] transition-colors focus:outline-none focus:border-[#027eb1] ${value ? "text-[#1e2939]" : "text-[#99a1af]"
                    }`}
            >
                <option value="">{placeholder}</option>
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#99a1af] pointer-events-none" />
        </div>
    );
}

export default function BrandModal({
    isOpen,
    onClose,
    brand,
    onSave,
}: BrandModalProps) {
    const [brandName, setBrandName] = useState(brand?.name || "");
    const [bannerPreview, setBannerPreview] = useState<string | null>(
        brand?.banner || null
    );
    const [logoPreview, setLogoPreview] = useState<string | null>(
        brand?.logo || null
    );
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [brandActive, setBrandActive] = useState(brand?.active ?? true);

    useEffect(() => {
        setBrandName(brand?.name || "");
        setBannerPreview(brand?.banner || null);
        setLogoPreview(brand?.logo || null);
        setBannerFile(null);
        setLogoFile(null);
        setBrandActive(brand?.active ?? true);
    }, [brand, isOpen]);

    if (!isOpen) return null;

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        await onSave({
            nombre: brandName.trim(),
            logo: logoFile,
            banner: bannerFile,
            activo: brandActive,
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="font-['Arimo'] font-bold text-[20px] text-[#003e7b]">
                        {brand ? "Editar Marca" : "Crear Marca"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="size-5 text-[#4a5565]" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div>
                        <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
                            Banner
                        </label>
                        <div className="relative h-[160px] border-2 border-dashed border-[#d1d5dc] rounded-[12px] bg-[#f9fafb] hover:border-[#027eb1] transition-colors overflow-hidden">
                            {bannerPreview ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={bannerPreview}
                                        alt="Banner preview"
                                        className="w-full h-full object-cover rounded-[10px]"
                                    />

                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        <label className="px-3 h-[32px] bg-white rounded-[8px] shadow-md hover:bg-gray-100 cursor-pointer flex items-center justify-center font-['Arimo'] text-[12px] text-[#1e2939]">
                                            Cambiar
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleBannerUpload}
                                            />
                                        </label>

                                        <button
                                            onClick={() => {
                                                setBannerPreview(null);
                                                setBannerFile(null);
                                            }}
                                            className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                        >
                                            <X className="size-4 text-[#d61216]" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <Upload className="size-8 text-[#99a1af] mb-2" />
                                    <span className="font-['Arimo'] text-[14px] text-[#4a5565]">
                                        Haz clic para subir banner
                                    </span>
                                    <span className="font-['Arimo'] text-[12px] text-[#99a1af] mt-1">
                                        1200 x 400px recomendado
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleBannerUpload}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
                            Logo
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-[120px] h-[120px] border-2 border-dashed border-[#d1d5dc] rounded-full bg-[#f9fafb] hover:border-[#027eb1] transition-colors overflow-hidden flex items-center justify-center">
                                {logoPreview ? (
                                    <>
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-3">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>

                                        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label className="px-3 h-[32px] bg-white rounded-[8px] shadow-md hover:bg-gray-100 cursor-pointer flex items-center justify-center font-['Arimo'] text-[12px] text-[#1e2939]">
                                                Cambiar
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                />
                                            </label>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setLogoPreview(null);
                                                setLogoFile(null);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                        >
                                            <X className="size-3 text-[#d61216]" />
                                        </button>
                                    </>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                        <Upload className="size-6 text-[#99a1af] mb-1" />
                                        <span className="font-['Arimo'] text-[11px] text-[#4a5565] text-center px-2">
                                            Subir logo
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="font-['Arimo'] text-[12px] text-[#4a5565] mb-1">
                                    Formato circular recomendado
                                </p>
                                <p className="font-['Arimo'] text-[12px] text-[#99a1af]">
                                    500 x 500px mínimo
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="Ej: Michelin"
                            className="w-full h-[46px] px-4 border border-[#d1d5dc] rounded-[10px] bg-white font-['Arimo'] text-[14px] text-[#1e2939] focus:outline-none focus:border-[#027eb1]"
                        />
                    </div>

                    {brand && (
                        <div>
                            <label className="block font-['Arimo'] font-medium text-[14px] text-[#1e2939] mb-2">
                                Estado
                            </label>
                            <FilterDropdown
                                value={brandActive ? "Activa" : "Inactiva"}
                                onChange={(value) => setBrandActive(value === "Activa")}
                                options={["Activa", "Inactiva"]}
                                placeholder="Seleccionar estado"
                            />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="h-[42px] px-6 border border-[#d1d5dc] rounded-[10px] font-['Arimo'] font-medium text-[14px] text-[#4a5565] hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="h-[42px] px-6 bg-[#027eb1] hover:bg-[#026a96] text-white rounded-[10px] font-['Arimo'] font-medium text-[14px] transition-colors"
                    >
                        {brand ? "Guardar Cambios" : "Crear Marca"}
                    </button>
                </div>
            </div>
        </div>
    );
}
