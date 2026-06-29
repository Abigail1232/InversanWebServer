import { useState, useMemo, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { SearchOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getBrandNames, getBrandYears, getBrandModels, getBrandVersions } from '../../api/products/brands';
import { useNavigate } from 'react-router-dom';

interface BrandFilterResult {
    brandId: number;
    brandName: string;
    year?: number;
    model?: string;
    version?: string;
}

interface BrandFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (result: BrandFilterResult) => void;
}

type FilterStep = 'marca' | 'año' | 'modelo' | 'version';

export default function BrandFilterModal({ isOpen, onClose, onComplete }: BrandFilterModalProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<FilterStep>('marca');
    const [selections, setSelections] = useState({ marca: '', año: '', modelo: '', version: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [brandOptions, setBrandOptions] = useState<Array<string>>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [selectedVehicleMake, setSelectedVehicleMake] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [yearOptions, setYearOptions] = useState<number[]>([]);
    const [modelOptions, setModelOptions] = useState<string[]>([]);
    const [versionOptions, setVersionOptions] = useState<string[]>([]);
    const [isLoadingStep, setIsLoadingStep] = useState(false);

    useEffect(() => {
        const loadBrands = async () => {
            setIsLoadingBrands(true);
            try {
                const brands = await getBrandNames();
                setBrandOptions(brands);
            } catch (error) {
                console.error('No se pudieron cargar las marcas de vehículo', error);
                setBrandOptions([]);
            } finally {
                setIsLoadingBrands(false);
            }
        };

        if (!isOpen) return;

        setStep('marca');
        setSelections({ marca: '', año: '', modelo: '', version: '' });
        setSearchTerm('');
        setSelectedVehicleMake('');
        setSelectedYear(null);
        setYearOptions([]);
        setModelOptions([]);
        setVersionOptions([]);
        void loadBrands();
    }, [isOpen]);

    const brandIdByName = useMemo(
        () => new Map(brandOptions.map((brand, index) => [brand, index + 1])),
        [brandOptions]
    );

    const handleSelect = async (value: string) => {
        try {
            if (step === 'marca') {
                setSelections(prev => ({ ...prev, marca: value, año: '', modelo: '', version: '' }));
                setSelectedVehicleMake(value);
                setSelectedYear(null);
                setModelOptions([]);
                setVersionOptions([]);
                setIsLoadingStep(true);

                const years = await getBrandYears(value);
                setYearOptions(years.map(y => y.year));
                setStep('año');
            } else if (step === 'año') {
                setSelections(prev => ({ ...prev, año: value, modelo: '', version: '' }));
                const yearNum = parseInt(value, 10);
                if (Number.isNaN(yearNum) || !selectedVehicleMake) return;

                setSelectedYear(yearNum);
                setVersionOptions([]);
                setIsLoadingStep(true);

                const models = await getBrandModels(selectedVehicleMake, yearNum);
                setModelOptions(models.map(m => m.name));
                setStep('modelo');
            } else if (step === 'modelo') {
                setSelections(prev => ({ ...prev, modelo: value, version: '' }));
                if (!selectedVehicleMake || selectedYear == null) return;

                setIsLoadingStep(true);
                const versions = await getBrandVersions(selectedVehicleMake, selectedYear, value);
                setVersionOptions(versions.map(v => v.name));
                setStep('version');
            } else {
                setSelections(prev => ({ ...prev, version: value }));

                if (onComplete) {
                    onComplete({
                        brandId: brandIdByName.get(selections.marca) ?? 0,
                        brandName: selections.marca,
                        year: selectedYear ?? undefined,
                        model: selections.modelo || undefined,
                        version: value || undefined,
                    });
                }

                onClose();
            }
        } catch (error) {
            console.error('Error al avanzar en el filtro de vehículo', error);
        } finally {
            setIsLoadingStep(false);
            setSearchTerm('');
        }
    };

    const handleBack = () => {
        setSearchTerm('');

        if (step === 'año') {
            setStep('marca');
            setSelections(prev => ({ ...prev, año: '', modelo: '', version: '' }));
            setSelectedYear(null);
            setModelOptions([]);
            setVersionOptions([]);
        } else if (step === 'modelo') {
            setStep('año');
            setSelections(prev => ({ ...prev, modelo: '', version: '' }));
            setVersionOptions([]);
        } else if (step === 'version') {
            setStep('modelo');
            setSelections(prev => ({ ...prev, version: '' }));
        }
    };

    const currentData = useMemo(() => {
        let data: string[] = [];

        if (step === 'marca') {
            data = brandOptions;
        } else if (step === 'año') {
            data = yearOptions.map(String);
        } else if (step === 'modelo') {
            data = modelOptions;
        } else if (step === 'version') {
            data = versionOptions;
        }

        if (!searchTerm) return data;
        return data.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [step, searchTerm, brandOptions, yearOptions, modelOptions, versionOptions]);

    const getPlaceholder = () => {
        if (step === 'marca') return 'Buscar por marca del vehículo...';
        if (step === 'año') return 'Buscar por año del vehículo...';
        if (step === 'modelo') return 'Buscar por modelo del vehículo...';
        return 'Buscar por versión del vehículo...';
    };

    const isLoading = isLoadingBrands || isLoadingStep;

    return (
        <>
            <style>
                {`
                .custom-brand-modal .ant-modal-wrap { padding: 0 !important; }
                .custom-brand-modal .ant-modal { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
                .custom-brand-modal .ant-modal-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 0 !important; }
                .custom-brand-modal .ant-modal-body { padding: 0 !important; background: transparent !important; }
                .custom-brand-modal .ant-modal-header,
                .custom-brand-modal .ant-modal-close { display: none !important; }

                .custom-brand-card { width: 100%; height: 100%; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
                .custom-close-square { width: 36px; height: 36px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.18); }
                `}
            </style>

            <Modal
                open={isOpen}
                onCancel={onClose}
                footer={null}
                closeIcon={null}
                centered
                width={820}
                className="custom-brand-modal sm:max-w-full"
                styles={{
                    mask: {
                        backdropFilter: 'blur(4px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    }
                }}
                closable={false}
                title={null}
            >
                <div className="custom-brand-card flex flex-col w-full h-full max-h-[90vh]">
                    <div className="w-full bg-[#003e7b] px-4 md:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center overflow-hidden flex-1">
                            {step !== 'marca' && (
                                <button
                                    onClick={handleBack}
                                    className="text-white bg-transparent border-0 cursor-pointer flex items-center justify-center p-1 transition-all active:scale-95 mr-2 md:mr-3 shrink-0"
                                    aria-label="Atrás"
                                >
                                    <ArrowLeftOutlined className="text-lg md:text-xl" />
                                </button>
                            )}

                            <h3 className="text-white text-sm md:text-lg font-bold m-0 flex items-center overflow-hidden">
                                <span className={`${step === 'marca' ? 'text-white' : 'text-white/40 font-normal'} whitespace-nowrap`}>
                                    Marca vehículo
                                </span>
                                <span className="text-white/30 font-normal mx-1 md:mx-2 shrink-0">&gt;</span>
                                <span className={`${step === 'año' ? 'text-white' : 'text-white/40 font-normal'} whitespace-nowrap`}>
                                    Año
                                </span>
                                <span className="text-white/30 font-normal mx-1 md:mx-2 shrink-0">&gt;</span>
                                <span className={`${step === 'modelo' ? 'text-white' : 'text-white/40 font-normal'} whitespace-nowrap`}>
                                    Modelo
                                </span>
                                <span className="text-white/30 font-normal mx-1 md:mx-2 shrink-0">&gt;</span>
                                <span className={`${step === 'version' ? 'text-white' : 'text-white/40 font-normal'} whitespace-nowrap`}>
                                    Versión
                                </span>
                            </h3>
                        </div>

                        <button
                            onClick={onClose}
                            className="custom-close-square flex items-center justify-center bg-transparent text-white hover:opacity-90 border-0 cursor-pointer flex-shrink-0"
                            aria-label="Cerrar"
                        >
                            <CloseOutlined />
                        </button>
                    </div>

                    <div className="p-4 md:p-6 bg-white overflow-y-auto">
                        <div className="mb-4 md:mb-5">
                            <Input
                                placeholder={getPlaceholder()}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                prefix={<SearchOutlined className="text-[#003e7b] mr-2" />}
                                className="h-11 md:h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] hover:border-[#003e7b] focus:border-[#003e7b] shadow-sm text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <p className="text-[#6c757d] text-sm">Cargando opciones...</p>
                            </div>
                        ) : currentData.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                                {currentData.map((item, index) => (
                                    <button
                                        key={`${step}-${index}`}
                                        onClick={() => handleSelect(item)}
                                        className="py-3 px-4 rounded-xl border-2 border-[#003e7b] bg-white text-[#003e7b] font-bold text-base hover:bg-[#f0f8ff] transition-all active:scale-95"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#f9fafb] rounded-2xl border border-dashed border-[#e5e7eb]">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6 relative">
                                    <SearchOutlined className="text-3xl text-[#003e7b]" />
                                </div>

                                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">
                                    No encontramos lo que buscas.
                                </h3>
                                <p className="text-[#6c757d] text-sm max-w-[360px] leading-relaxed mb-6">
                                    Lo sentimos, no pudimos encontrar opciones con esos filtros.
                                </p>

                                <button
                                    onClick={() => navigate("/suggestions")}
                                    className="text-[#003e7b] font-bold text-base hover:underline border-0 bg-transparent cursor-pointer transition-all"
                                >
                                    Generar Sugerencias
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
