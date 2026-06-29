import { useState, useEffect, createElement } from 'react';
import { createPortal } from 'react-dom';
import type { ProductImage } from '../../types/product';

interface Props {
  images: ProductImage[];
  model3DUrl?: string;
}

export default function ProductGallery({ images, model3DUrl }: Props) {
  const [current, setCurrent] = useState(0);//saber en que imagen estamos
  const [modalOpen, setModalOpen] = useState(false);//saber si el modal esta abierto
  const [modal3DOpen, setModal3DOpen] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);
  const [model3DExists, setModel3DExists] = useState(false);
  
  // Estados separados para el zoom
  const [mainZoomPosition, setMainZoomPosition] = useState({ x: 0, y: 0 });
  const [isMainZoomed, setIsMainZoomed] = useState(false);
  const [modalZoomPosition, setModalZoomPosition] = useState({ x: 0, y: 0 });
  const [isModalZoomed, setIsModalZoomed] = useState(false);

  // Verificar si el archivo 3D existe
  useEffect(() => {
    const checkModel3DExists = async () => {
      if (!model3DUrl) {
        setModel3DExists(false);
        return;
      }

      try {
        const fullUrl = model3DUrl.startsWith('http') 
          ? model3DUrl 
          : `${import.meta.env.VITE_API_URL}/public/${model3DUrl.replace(/^\/+/, '')}`;
        
        // Hacer una petición HEAD para verificar si el archivo existe
        const response = await fetch(fullUrl, { method: 'HEAD' });
        setModel3DExists(response.ok);
      } catch (error) {
        console.log('Error verificando modelo 3D:', error);
        setModel3DExists(false);
      }
    };

    checkModel3DExists();
  }, [model3DUrl]);

  // Funciones para el zoom en la imagen principal
  const handleMainMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMainZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMainZoomPosition({ x, y });
  };

  const handleMainMouseEnter = () => setIsMainZoomed(true);
  const handleMainMouseLeave = () => {
    setIsMainZoomed(false);
    setMainZoomPosition({ x: 50, y: 50 }); // Reset al centro
  };

  // Funciones para el zoom en el modal
  const handleModalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isModalZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setModalZoomPosition({ x, y });
  };

  const handleModalMouseEnter = () => setIsModalZoomed(true);
  const handleModalMouseLeave = () => {
    setIsModalZoomed(false);
    setModalZoomPosition({ x: 50, y: 50 }); // Reset al centro
  };

  useEffect(() => {
    if (!modal3DOpen || !model3DUrl) return;
    import('@google/model-viewer').then(() => setModelViewerReady(true));
  }, [modal3DOpen, model3DUrl]);

  useEffect(() => {
    if (!modalOpen && !modal3DOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setModal3DOpen(false);
      }
      if (modalOpen && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + images.length) % images.length);
        if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, modal3DOpen]);

  // Desactivar zoom principal cuando se abre el modal
  useEffect(() => {
    if (modalOpen) {
      setIsMainZoomed(false);
      setMainZoomPosition({ x: 50, y: 50 });
    }
  }, [modalOpen]);

  return (
    <div className="flex flex-col gap-4">
      {(!images || images.length === 0) ? (
        <div className="relative rounded-[10px] overflow-hidden border border-[#e5e7eb] bg-white aspect-square flex items-center justify-center p-8 text-center text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>Imagen no disponible</p>
          </div>
        </div>
      ) : (
        <>
          {/*imagen principal - clickable*/}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setModalOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
            onMouseMove={handleMainMouseMove}
            onMouseEnter={handleMainMouseEnter}
            onMouseLeave={handleMainMouseLeave}
            className="relative rounded-[10px] overflow-hidden border border-[#e5e7eb] bg-white aspect-square cursor-pointer"
            style={{ cursor: isMainZoomed ? 'zoom-in' : 'pointer' }}
            aria-label="Ampliar imagen"
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/public/${images[current].url}`}
              alt={images[current].alt}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isMainZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={{
                transformOrigin: `${mainZoomPosition.x}% ${mainZoomPosition.y}%`,
                transform: isMainZoomed ? `scale(1.5)` : 'scale(1)'
              }}
            />

            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow-lg text-gray-700 hover:bg-white transition-colors border-0 p-0"
              aria-label="Imagen anterior"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1L1 7L7 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow-lg text-gray-700 hover:bg-white transition-colors border-0 p-0"
              aria-label="Siguiente imagen"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L7 7L1 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-0.5 rounded-full">
              {current + 1} / {images.length}
            </span>
          </div>

          {/*miniaturas*/}
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden flex-nowrap scroll-smooth max-w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`w-20 h-20 flex-shrink-0 rounded-[10px] overflow-hidden border-2 transition-all p-0 bg-transparent ${i === current
                  ? 'border-[#027eb1] shadow-[0_0_0_2px_rgba(2,126,177,0.3)]'
                  : 'border-[#e5e7eb]'
                  }`}
                aria-label={`Ver ${img.alt}`}
              >
                <img src={`${import.meta.env.VITE_API_URL}/public/${img.url}`} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Botón 3D - solo mostrar si el modelo existe */}
      {model3DExists && (
        <button
          onClick={() => setModal3DOpen(true)}
          className="w-full border-2 border-[#027eb1] text-[#027eb1] font-medium text-base py-3 rounded-[10px] hover:bg-blue-50 transition-colors bg-transparent"
        >
          Ver Modelo 3D
        </button>
      )}

      {/*modal - portal para evitar problemas de overflow*/}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de imágenes del producto"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div
            className="relative bg-white rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[95vw] md:max-w-[1024px] h-[60vh] md:h-[683px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute top-0 left-0 right-0 z-10 h-[72px] flex items-center justify-between px-4"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}
            >
              <div className="flex items-center">
                <span className="bg-black/50 text-white text-base font-medium px-3 py-1 rounded-[10px]">
                  {current + 1} / {images.length}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors border-0"
                aria-label="Cerrar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/*contenido: imagen + flechas*/}
            <div className="flex-1 relative bg-[#f3f4f6] min-h-0">
              <div 
                className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden"
                onMouseMove={handleModalMouseMove}
                onMouseEnter={handleModalMouseEnter}
                onMouseLeave={handleModalMouseLeave}
                style={{ cursor: isModalZoomed ? 'zoom-in' : 'default' }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}/public/${images[current].url}`}
                  alt={images[current].alt}
                  className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                    isModalZoomed ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    transformOrigin: `${modalZoomPosition.x}% ${modalZoomPosition.y}%`,
                    transform: isModalZoomed ? `scale(1.5)` : 'scale(1)'
                  }}
                />
              </div>

              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-colors border-0"
                aria-label="Imagen anterior"
              >
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-colors border-0"
                aria-label="Siguiente imagen"
              >
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/*linea de abajo*/}
            <div
              className="h-0.5 flex-shrink-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
            />

            {/*miniaturas*/}
            <div className="flex gap-2 justify-start p-4 bg-[#f3f4f6] flex-shrink-0 overflow-x-auto overflow-y-hidden flex-nowrap scroll-smooth max-w-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrent(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-[10px] overflow-hidden border-[1.15px] transition-all p-0 ${i === current
                    ? 'border-[#027eb1] shadow-[0_0_0_2px_rgba(2,126,177,0.5)]'
                    : 'border-white/50 opacity-60 hover:opacity-100'
                    }`}
                  aria-label={`Ver ${img.alt}`}
                >
                  <img src={`${import.meta.env.VITE_API_URL}/public/${img.url}`} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/*modal 3d - portal para no ser recortado por overflow del padre*/}
      {modal3DOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Modelo 3D del producto"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setModal3DOpen(false)}
            aria-hidden
          />
          <div
            className="relative bg-white rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[1024px] h-[683px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal3DOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors border-0"
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div
              className="flex-1 flex flex-col min-h-0 p-6"
              style={{ background: 'linear-gradient(146deg, rgba(2, 126, 177, 0.1) 0%, rgba(0, 62, 123, 0.1) 100%)' }}
            >
              <div className="flex-1 min-h-[200px] rounded-[10px] overflow-hidden bg-white/50 border border-[#e5e7eb] flex items-center justify-center">
                {model3DUrl ? (
                  modelViewerReady ? (
                    createElement('model-viewer', {
                      src: model3DUrl.startsWith('http') ? model3DUrl : `${import.meta.env.VITE_API_URL}/public/${model3DUrl.replace(/^\/+/, '')}`,
                      alt: 'Modelo 3D del producto',
                      'camera-controls': true,
                      'auto-rotate': true,
                      'shadow-intensity': '1',
                      exposure: '0.8',
                      'environment-image': 'neutral',
                      'tone-mapping': 'commerce',
                      style: { width: '100%', height: '100%', minHeight: '280px' },
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                      <CubeIcon />
                      <p className="text-sm text-center">Cargando modelo 3D…</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-[#4a4a4a] p-8">
                    <CubeIcon />
                    <p className="text-sm text-center">No hay modelo 3D disponible para este producto.</p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="h-0.5 flex-shrink-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'w-16 h-16 text-[#027eb1]'}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M48 16L16 36v24l32 20 32-20V36L48 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M48 16v40M16 36l32 20 32-20M16 60l32-20 32 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
