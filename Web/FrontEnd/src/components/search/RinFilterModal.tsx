import { useState, useMemo, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { SearchOutlined, CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { getFiltrosLlantas, type ProductoFiltroLlanta } from '../../api/products/rines';

interface RinFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryId?: number | null;
    branchId?: number;
    onFilterComplete?: (
        productos: ProductoFiltroLlanta[],
        filtros: { rin: number; alto_rin: number; ancho_rin: number }
    ) => void;
}

type FilterStep = 'rin' | 'alto' | 'ancho';

export default function RinFilterModal({
    isOpen,
    onClose,
    categoryId,
    branchId,
    onFilterComplete,
}: RinFilterModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<FilterStep>('rin');
    const [selections, setSelections] = useState({ rin: '', alto: '', ancho: '' });
    const [rinOptions, setRinOptions] = useState<number[]>([]);
    const [altoOptions, setAltoOptions] = useState<number[]>([]);
    const [anchoOptions, setAnchoOptions] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setSearchTerm('');
        setStep('rin');
        setSelections({ rin: '', alto: '', ancho: '' });
        setAltoOptions([]);
        setAnchoOptions([]);

        const load = async () => {
            setIsLoading(true);
            try {
                const res = await getFiltrosLlantas({
                    ...(categoryId ? { id_categoria: categoryId } : {}),
                    ...(branchId ? { id_sucursal: branchId } : {}),
                });
                setRinOptions(res.filtros.rines);
            } catch (err) {
                console.error('Error cargando rines:', err);
                setRinOptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [isOpen, categoryId, branchId]);

    const handleSelectRin = async (value: string) => {
        setSelections(prev => ({ ...prev, rin: value, alto: '', ancho: '' }));
        setSearchTerm('');
        setIsLoading(true);

        try {
            const res = await getFiltrosLlantas({
                ...(categoryId ? { id_categoria: categoryId } : {}),
                ...(branchId ? { id_sucursal: branchId } : {}),
                rin: parseInt(value),
            });

            setAltoOptions(res.filtros.altos_rin);
            setStep('alto');
        } catch (err) {
            console.error('Error cargando altos:', err);
            setAltoOptions([]);
            setStep('alto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAlto = async (value: string | null) => {
        setSelections(prev => ({ ...prev, alto: value ?? '', ancho: '' }));
        setSearchTerm('');
        setIsLoading(true);

        try {
            const res = await getFiltrosLlantas({
                ...(categoryId ? { id_categoria: categoryId } : {}),
                ...(branchId ? { id_sucursal: branchId } : {}),
                rin: parseInt(selections.rin),
                ...(value !== null ? { alto_rin: parseFloat(value) } : {}),
            });

            setAnchoOptions(res.filtros.anchos_rin);
            setStep('ancho');
        } catch (err) {
            console.error('Error cargando anchos:', err);
            setAnchoOptions([]);
            setStep('ancho');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAncho = async (value: string) => {
        const finalSelections = { ...selections, ancho: value };
        setSelections(finalSelections);
        setIsLoading(true);

        try {
            const res = await getFiltrosLlantas({
                ...(categoryId ? { id_categoria: categoryId } : {}),
                ...(branchId ? { id_sucursal: branchId } : {}),
                rin: parseInt(finalSelections.rin),
                ...(finalSelections.alto !== '' ? { alto_rin: parseFloat(finalSelections.alto) } : {}),
                ancho_rin: parseFloat(value),
            });

            onFilterComplete?.(res.productos, {
                rin: parseInt(finalSelections.rin),
                alto_rin: finalSelections.alto !== '' ? parseFloat(finalSelections.alto) : 0,
                ancho_rin: parseFloat(value),
            });

        } catch (err) {
            console.error('Error cargando productos filtrados:', err);
            onFilterComplete?.([], {
                rin: parseInt(finalSelections.rin),
                alto_rin: finalSelections.alto !== '' ? parseFloat(finalSelections.alto) : 0,
                ancho_rin: parseFloat(value),
            });
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    const handleSelect = (value: string) => {
        if (step === 'rin') void handleSelectRin(value);
        else if (step === 'alto') void handleSelectAlto(value);
        else void handleSelectAncho(value);
    };

    const currentOptions = useMemo(() => {
        let base: string[];

        if (step === 'rin') base = rinOptions.map(String);
        else if (step === 'alto') {
            base = altoOptions.map(String);
        }
        else base = anchoOptions.map(String);

        if (!searchTerm.trim()) return base;

        return base.filter(item => {
            const itemText = (step === 'alto' && item === '0') ? 'sin perfil' : item.toLowerCase();
            return itemText.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [step, searchTerm, rinOptions, altoOptions, anchoOptions]);

    const getPlaceholder = () => {
        if (step === 'rin') return 'Buscar por tamaño de rin...';
        if (step === 'alto') return 'Buscar por perfil...';
        return 'Buscar por alto...';
    };

    const getLabel = (item: string) => {
        if (step === 'rin') return `Rin ${item}`;
        if (step === 'alto') {
            return item === '0' ? 'Sin perfil' : `Perfil ${item}`;
        }
        return `Alto ${item}`;
    };

    const stepBack = () => {
        setSearchTerm('');

        if (step === 'alto') {
            setStep('rin');
            setSelections(prev => ({ ...prev, alto: '', ancho: '' }));
        } else if (step === 'ancho') {
            setStep('alto');
            setSelections(prev => ({ ...prev, ancho: '' }));
        }
    };

    return (
        <>
            <style>{`
                .custom-rin-modal .ant-modal-wrap { padding: 0 !important; }
                .custom-rin-modal .ant-modal { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
                .custom-rin-modal .ant-modal-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 0 !important; }
                .custom-rin-modal .ant-modal-body { padding: 0 !important; background: transparent !important; }
                .custom-rin-modal .ant-modal-header,
                .custom-rin-modal .ant-modal-close { display: none !important; }
                .custom-rin-card { width: 100%; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
                .custom-close-square { width: 36px; height: 36px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.18); }
                .rin-btn-back { background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25); color: white; border-radius: 8px; padding: 4px 12px; font-size: 13px; cursor: pointer; transition: background 0.15s; }
                .rin-btn-back:hover { background: rgba(255,255,255,0.22); }
                @keyframes rin-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .rin-grid-anim { animation: rin-fade-in 0.2s ease both; }
                .rin-spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #003e7b; border-radius: 50%; animation: spin 0.6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <Modal
                open={isOpen}
                onCancel={onClose}
                footer={null}
                closeIcon={null}
                centered
                width={820}
                className="custom-rin-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' } }}
                closable={false}
                title={null}
            >
                <div className="custom-rin-card flex flex-col w-full max-h-[90vh]">
                    <div className="w-full bg-[#003e7b] px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            {step !== 'rin' && (
                                <button
                                    onClick={stepBack}
                                    className="rin-btn-back flex-shrink-0 flex items-center gap-2"
                                >
                                    <LeftOutlined />
                                    <span>Volver</span>
                                </button>
                            )}

                            <h3 className="text-white text-sm md:text-base font-bold m-0 flex items-center overflow-hidden">
                                {(['rin', 'alto', 'ancho'] as FilterStep[]).map((s, i) => (
                                    <span key={s} className="flex items-center">
                                        {i > 0 && (
                                            <span className="text-white/30 font-normal mx-1 md:mx-2 shrink-0">
                                                &gt;
                                            </span>
                                        )}
                                        <span className={step === s ? 'text-white' : 'text-white/40 font-normal'}>
                                            {s === 'rin' ? 'Rin' : s === 'alto' ? 'Perfil' : 'Alto'}
                                            {selections[s] && step !== s && (
                                                <span className="ml-1 text-white/70 text-xs">
                                                    ({s === 'alto' && selections[s] === '0' ? 'Sin perfil' : selections[s]})
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                ))}
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
                                className="h-10 md:h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] hover:border-[#003e7b] focus:border-[#003e7b] shadow-sm text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="rin-spinner" />
                                <p className="text-sm text-[#6c757d]">Cargando opciones...</p>
                            </div>
                        ) : (
                            <>
                                {currentOptions.length > 0 ? (
                                    <div key={step} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 rin-grid-anim">
                                        {currentOptions.map((item, index) => (
                                            <button
                                                key={`${step}-${index}`}
                                                onClick={() => handleSelect(item)}
                                                className="py-3 px-4 rounded-xl border-2 border-[#003e7b] bg-white text-[#003e7b] font-bold text-base hover:bg-[#f0f8ff] hover:border-[#0056a8] transition-all active:scale-95"
                                            >
                                                {getLabel(item)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#f9fafb] rounded-2xl border border-dashed border-[#e5e7eb]">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                                            <SearchOutlined className="text-2xl text-[#003e7b]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Sin resultados</h3>
                                        <p className="text-[#6c757d] text-sm max-w-[320px]">
                                            No hay opciones disponibles para los filtros seleccionados.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}