import { useEffect, useMemo, useState } from 'react';
import { MapPin, Send, Phone, Clock, ChevronDown, Mail } from 'lucide-react';
import { Select, Card, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

type Departamento = {
  nombre_departamento: string;
};

type Municipio = {
  nombre: string;
  departamento?: Departamento;
};

type Usuario = {
  id_usuario: number;
  primer_nombre?: string;
  primer_apellido?: string;
  correo?: string; // si algún día lo incluyen
  telefono?: string; // si algún día lo incluyen
};

type Sucursal = {
  id_sucursal: number;
  nombre: string;
  RTN?: string;
  activo: boolean;
  id_municipio: number;
  id_usuario: number;
  direccion?: string | null;
  lat?: number | null;
  lng?: number | null;
  municipio?: Municipio;
  usuario?: Usuario;

  // Campos opcionales (si los agregan en DB/backend luego)
  correo?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  horario?: {
    lunes_a_viernes?: string | null; // "8:00 - 17:00"
    sabado?: string | null; // "8:00 - 12:00"
    domingo?: string | null; // "Cerrado"
  } | null;
};

function buildMapsEmbed(lat?: number | null, lng?: number | null) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=16&output=embed`;
}

function buildMapsDirectionsUrl(lat?: number | null, lng?: number | null) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

function safeJoin(parts: Array<string | undefined | null>, sep = ', ') {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(sep);
}

export default function ContactPage() {
  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  const [branches, setBranches] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // guardamos el id_sucursal seleccionado
  const [branchId, setBranchId] = useState<number | null>(null);
  
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`${API_BASE}/api/sucursales`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`Error cargando sucursales (${res.status})`);
        }

        const data = (await res.json()) as Sucursal[];

        if (cancelled) return;

        // (opcional) filtrar solo activas
        const actives = Array.isArray(data) ? data.filter((b) => b?.activo) : [];

        setBranches(actives);

        // Selecciona primera por defecto
        if (actives.length > 0) {
          setBranchId(actives[0].id_sucursal);
        } else {
          setBranchId(null);
        }
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message || 'Error desconocido');
        setBranches([]);
        setBranchId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  
  const selectedBranch = useMemo(() => {
    if (branchId == null) return null;
    return branches.find((b) => b.id_sucursal === branchId) || null;
  }, [branches, branchId]);

  const mapEmbed = useMemo(() => buildMapsEmbed(selectedBranch?.lat, selectedBranch?.lng), [selectedBranch]);
  const mapsDirectionsUrl = useMemo(
    () => buildMapsDirectionsUrl(selectedBranch?.lat, selectedBranch?.lng),
    [selectedBranch]
  );
useEffect(() => {
  // Cada vez que cambia el mapa (sucursal), mostramos el cargando otra vez
  if (mapEmbed) setMapLoading(true);
}, [mapEmbed]);
  // Texto “cómo llegar” (todo desde DB si viene)
  const locationText = useMemo(() => {
    if (!selectedBranch) return '';

    const muni = selectedBranch.municipio?.nombre;
    const depto = selectedBranch.municipio?.departamento?.nombre_departamento;
    const addr = selectedBranch.direccion;

    // Ej: "Ubicados en Avenida Central 456 (Tegucigalpa, Francisco Morazán)."
    const place = safeJoin([muni, depto], ', ');
    if (addr && place) return `Ubicados en ${addr} (${place}).`;
    if (addr) return `Ubicados en ${addr}.`;
    if (place) return `Ubicados en ${place}.`;
    return 'Ubicación no disponible.';
  }, [selectedBranch]);

  // Correo / teléfono (si existen por sucursal en DB; si no, defaults sin romper UI)
  const correo = selectedBranch?.correo || 'inversanhn@hotmail.com';
  const telefono = selectedBranch?.telefono || '+50495240039';
  const whatsapp = selectedBranch?.whatsapp || '50425501234';

  // Horarios (si existen por sucursal en DB; si no, defaults)
  const horarioLunesViernes = selectedBranch?.horario?.lunes_a_viernes || '7:30 AM - 5:00 PM';
  const horarioSabado = selectedBranch?.horario?.sabado || '7:30 AM - 12:00 PM';
  const horarioDomingo = selectedBranch?.horario?.domingo || 'Cerrado';

  useEffect(() => {
  if (!mapEmbed) return;
  const t = setTimeout(() => setMapLoading(false), 8000);
  return () => clearTimeout(t);
}, [mapEmbed]);

  function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f3f4f6]">
      {/* Logo */}
      

      {/* Puntitos */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-3 h-3 rounded-full bg-[#93c5fd] animate-bounce [animation-delay:-0.2s]" />
        <span className="w-3 h-3 rounded-full bg-[#60a5fa] animate-bounce [animation-delay:-0.1s]" />
        <span className="w-3 h-3 rounded-full bg-[#3b82f6] animate-bounce" />
      </div>

      {/* Texto */}
      <p className="text-[#027eb1] text-sm font-medium text-center px-4">
        Líderes en distribución de llantas para todo tipo de vehículos.
      </p>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-[1280px] mx-auto px-4 py-8 animate-page-enter">
        <div className="mb-8">
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Contáctanos
          </Typography.Title>
          <Typography.Text type="secondary">
            Ubicación, horarios y datos de contacto de nuestras sucursales.
          </Typography.Text>
        </div>

        <div className="bg-white border border-black/25 rounded-[20px] p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[#1a1a1a] text-xl">Estamos ubicados en</p>

            <Select
              value={branchId ?? undefined}
              onChange={(val) => setBranchId(val)}
              suffixIcon={<ChevronDown className="w-5 h-5 text-[#1a1a1a]" />}
              className="w-full sm:w-[300px] h-[54px] [&_.ant-select-selector]:h-[54px] [&_.ant-select-selection-item]:leading-[54px] [&_.ant-select-selection-item]:text-lg"
              loading={loading}
              disabled={loading || branches.length === 0}
              options={branches.map((b) => ({ value: b.id_sucursal, label: b.nombre }))}
            />
          </div>

          {!!errorMsg && (
            <div className="mt-3">
              <Typography.Text type="danger">{errorMsg}</Typography.Text>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-page-enter-delay-1">
         <div className="bg-white border border-black/25 rounded-[20px] overflow-hidden h-full min-h-[300px] relative">
  {/* Overlay como el cargando de la web */}
  {(loading || mapLoading) && mapEmbed && <MapLoadingOverlay />}

  {mapEmbed ? (
    <iframe
      title={`Ubicación ${selectedBranch?.nombre || 'Sucursal'}`}
      src={mapEmbed}
      className="w-full h-full min-h-[300px] border-0"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={() => setMapLoading(false)}
      onError={() => setMapLoading(false)}
    />
  ) : (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <Typography.Text type="secondary">No hay coordenadas para mostrar el mapa.</Typography.Text>
    </div>
  )}
</div>

          <div className="bg-white border border-black/25 rounded-[20px] p-8 flex flex-col gap-6">
            <h2 className="text-[#1a1a1a] text-2xl font-medium border-b border-[#f3f4f6] pb-2">
              Información de Contacto
            </h2>

            <div className="bg-gradient-to-b from-[#f8f9fb] to-white border border-[#e5e7eb] rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-[10px] bg-[#003e7b] flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[#6b7280] text-base font-medium uppercase mb-1">Cómo llegar</p>

                  <p className="text-[#4a4a4a] text-sm leading-relaxed mb-3">{locationText}</p>

                  <a
                    href={mapsDirectionsUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-[10px] transition-colors ${
                      mapsDirectionsUrl ? 'bg-[#027eb1] hover:bg-[#026a9a]' : 'bg-gray-400 pointer-events-none'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    Ver cómo llegar en Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#f8f9fb] to-white border border-[#e5e7eb] rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-[10px] bg-[#027eb1] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[#6b7280] text-base font-medium uppercase mb-1">Correo</p>
                  <a href={`mailto:${correo}`} className="text-[#1a1a1a] text-base leading-relaxed hover:underline">
                    {correo}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#f8f9fb] to-white border border-[#e5e7eb] rounded-2xl p-5">
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-[10px] bg-[#027eb1] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[#6b7280] text-base font-medium uppercase mb-1">Teléfono</p>
                  <a href={`tel:${telefono}`} className="text-[#1a1a1a] text-lg font-medium">
                    {telefono.startsWith('+504') ? `(${telefono.slice(0, 4)}) ${telefono.slice(4)}` : telefono}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#f8f9fb] to-white border border-[#e5e7eb] rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-[10px] bg-[#d61216] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[#6b7280] text-base font-medium uppercase mb-2">Horarios de atención</p>
                  <div className="rounded-[10px] py-2 space-y-1 text-[#4a4a4a] text-sm">
                    <p>
                      <span className="font-semibold text-[#1a1a1a]">Lunes a Viernes:</span> {horarioLunesViernes}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1a1a1a]">Sábado:</span> {horarioSabado}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1a1a1a]">Domingo:</span> {horarioDomingo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center animate-page-enter-delay-2">
          <Card variant="outlined" className="border-[#bedbff] bg-[#eff6ff] shadow-sm w-full max-w-8xl">
            <div className="flex flex-col items-center text-center">
              <CheckCircleOutlined className="text-[#155dfc] text-xl mb-2" />
              <Typography.Title level={5} style={{ color: '#155dfc', marginTop: 0 }}>
                ¿Necesitas ayuda con tu compra?
              </Typography.Title>
              <Typography.Paragraph className="text-[#4a4a4a] text-[14px] m-0 mb-4">
                Nuestro equipo de expertos está listo para asesorarte en la selección de las llantas perfectas para tu
                vehículo. Contáctanos y te ayudaremos a encontrar la mejor opción.
              </Typography.Paragraph>

              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold text-base px-4 py-3 rounded-[10px] shadow-md transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}