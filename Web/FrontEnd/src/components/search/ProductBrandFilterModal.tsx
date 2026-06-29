import { useState, useMemo, useEffect } from 'react';
import { Modal, Input } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { getBrands, type BrandItem } from '../../api/products/brands';

interface ProductBrandFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (brand: BrandItem) => void;
}

export default function ProductBrandFilterModal({ isOpen, onClose, onComplete }: ProductBrandFilterModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const load = async () => {
            setIsLoading(true);
            try {
                const data = await getBrands();
                setBrands(data.filter(b => b.name)); 
            } catch (err) {
                console.error('Error cargando marcas de producto:', err);
                setBrands([]);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
        setSearchTerm('');
    }, [isOpen]);

    const filteredBrands = useMemo(() => {
        if (!searchTerm.trim()) return brands;
        return brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [brands, searchTerm]);

    const handleSelect = (brand: BrandItem) => {
        onComplete?.(brand);
        onClose();
    };

    return (
        <>
            <style>{`
                .custom-pbrand-modal .ant-modal-wrap { padding: 0 !important; }
                .custom-pbrand-modal .ant-modal { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
                .custom-pbrand-modal .ant-modal-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 0 !important; }
                .custom-pbrand-modal .ant-modal-body { padding: 0 !important; background: transparent !important; }
                .custom-pbrand-modal .ant-modal-header,
                .custom-pbrand-modal .ant-modal-close { display: none !important; }
                .custom-pbrand-card { width: 100%; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
                .custom-close-square { width: 36px; height: 36px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.18); }
            `}</style>

            <Modal
                open={isOpen}
                onCancel={onClose}
                footer={null}
                closeIcon={null}
                centered
                width={820}
                className="custom-pbrand-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)' } }}
                closable={false}
                title={null}
            >
                <div className="custom-pbrand-card flex flex-col w-full max-h-[90vh]">
                    <div className="w-full bg-[#003e7b] px-4 md:px-6 py-4 flex items-center justify-between">
                        <h3 className="text-white text-sm md:text-base font-bold m-0 pl-2">
                           Selecciona la marca de llanta
                        </h3>
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
                                placeholder="Buscar marca (Michelin, Bridgestone...)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                prefix={<SearchOutlined className="text-[#003e7b] mr-2" />}
                                className="h-10 md:h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] hover:border-[#003e7b] focus:border-[#003e7b] shadow-sm text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#003e7b] rounded-full animate-spin" />
                                <p className="text-sm text-[#6c757d]">Cargando marcas...</p>
                            </div>
                        ) : filteredBrands.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                                {filteredBrands.map((item) => {
                                    const imageUrl = item.imageUrl
                                        ? `${import.meta.env.VITE_API_URL}/public/${item.imageUrl}`
                                        : null;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-[#e5e7eb] bg-white hover:border-[#027eb1] hover:bg-[#f0f8ff] transition-all active:scale-95 group"
                                        >
                                            <div className="w-full aspect-square flex items-center justify-center mb-2 overflow-hidden">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name}
                                                        className="max-w-full max-h-full object-contain filter group-hover:drop-shadow-sm transition-all"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#f9fafb] rounded-lg flex items-center justify-center text-[#99a1af] font-bold text-xs">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[#1a1a1a] font-bold text-sm text-center line-clamp-1 group-hover:text-[#027eb1]">
                                                {item.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#f9fafb] rounded-2xl border border-dashed border-[#e5e7eb]">
                                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No se encontraron marcas</h3>
                                <p className="text-[#6c757d] text-sm">Prueba con otro nombre de búsqueda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
