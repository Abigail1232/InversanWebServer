import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select, Modal, Form, message, Spin, Switch, ConfigProvider } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { Sucursal, Bodega } from "../../types/branch";
import { getAllBranches, getBranch, getEmployeeCountForBranch, toggleBranchStatus, createBranch, updateBranch } from "../../api/branches/branches"
import { getAllBodegas, createBodega, getBodega, toggleBodegaStatus, updateBodega } from "../../api/branches/bodegas";
import {
  Pencil,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { getUsers } from "../../api/user/user";
import { FilterBar } from "../../components/FilterBar";
import markerIconUrl from "leaflet/dist/images/marker-icon.png?url";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png?url";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png?url";

type BranchStatus = "Inactivo" | "Activo";
const BRANCH_CHANGED_EVENT = "branchChanged";
const BRANCHES_UPDATED_EVENT = "branchesUpdated";
const BRANCH_STORAGE_KEY = "selectedBranch";

const SANTA_ROSA_COPAN = { lat: 14.7667, lng: -88.7833 };


const HONDURAS_BOUNDS: [[number, number], [number, number]] = [
  [12.98, -89.35], // SW aprox
  [16.52, -83.15], // NE aprox
];

const STATUS_OPTIONS: BranchStatus[] = ["Activo", "Inactivo"];

/*
// ================================
// API MOCK (futuro backend)
// ================================
const api = {
  listBranches: async (): Promise<Sucursal[]> => MOCK_BRANCHES,
  createBranch: async (_payload: Partial<Sucursal>) => true,
  updateBranch: async (_id: string, _payload: Partial<Sucursal>) => true,
  deactivateBranch: async (_id: string) => true,

  // ✅ futuro: verificar contraseña (ideal en backend)
  verifyPassword: async (password: string) => password === MOCK_ADMIN_PASSWORD,
};
*/
// ================================
// UI Helpers
// ================================
const isBodegaActive = (bodega: Bodega) =>
  typeof bodega.activo === "boolean" ? bodega.activo : bodega.sucursal.activo;

type LatLng = { lat: number; lng: number };
type City = { city: string, state: string };

// ================================
// Mapa Lazy (NO carga al inicio, solo al abrir modal)
// ================================
function MapPickerLazy({
  value,
  onChange,
  onAddressChange,
  onCityChange,
  country = "Honduras",
  bounds = HONDURAS_BOUNDS,
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  address: string;
  onAddressChange: (addr: string) => void;
  onCityChange?: (c: City) => void;
  country?: string;
  bounds?: [[number, number], [number, number]];
}) {
  const [ready, setReady] = useState(false);

  // módulos cargados dinámicamente
  const [RL, setRL] = useState<any>(null);
  const [L, setL] = useState<any>(null);

  // input manual (opcional) para buscar
  const [manualQuery, setManualQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // para saber si la dirección fue autogenerada por click
  const lastAutoAddressRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const RLmod = await import("react-leaflet");
        const Lmod = await import("leaflet");
        if (!mounted) return;

        setRL(RLmod);
        setL(Lmod);

        // Fix iconos (Vite + Leaflet)
        const icon = new Lmod.Icon({
          iconUrl: markerIconUrl,
          iconRetinaUrl: markerIconRetinaUrl,
          shadowUrl: markerShadowUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        (Lmod as any).__INVERSAN_ICON__ = icon;

        setReady(true);
      } catch (e) {
        message.error("No se pudo cargar el mapa. Revisa tu instalación de leaflet/react-leaflet.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Reverse geocode: click -> dirección
  const reverseGeocode = async (p: LatLng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      const display = data?.display_name;
      if (display) {
        lastAutoAddressRef.current = display;
        onAddressChange(display);
      }

      const city = data?.address?.city || data?.address?.town || data?.address?.village;
      const state = data?.address?.state;

      if (onCityChange) onCityChange({ city, state }); // ✅ avisar al padre

      // console.log("Ciudad detectada:", city);
      // console.log("Estado detectado:", state);
    } catch {
      // ignore
    }
  };

  // Geocode: solo si usuario escribió manualmente
  const geocodeManual = async () => {
    const q = manualQuery.trim();
    if (!q) return;

    try {
      setSearchLoading(true);

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        `${q}, ${country}`
      )}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();

      if (data?.[0]) {
        const p = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
        onChange(p);

        // si buscó manual, actualizamos también dirección del form
        const display = data[0]?.display_name;
        if (display) onAddressChange(display);
      } else {
        message.warning("No se encontró la dirección. Prueba con más detalle.");
      }
    } catch {
      message.error("No se pudo buscar la dirección (verifica tu internet).");
    } finally {
      setSearchLoading(false);
    }
  };

  if (!ready || !RL || !L) {
    return (
      <div className="w-full h-full min-h-[240px] rounded-xl border border-slate-200 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Spin />
          <div className="text-xs text-slate-500">Cargando mapa…</div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = RL;

  function ClickHandler() {
    useMapEvents({
      click(e: any) {
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        onChange(p);
        reverseGeocode(p); // ✅ actualiza dirección a la izquierda
      },
    });
    return null;
  }

  // ✅ Leaflet no re-centra solo con props, así que lo forzamos
  function RecenterMap({ position }: { position: LatLng }) {
    const map = useMap();
    useEffect(() => {
      map.setView([position.lat, position.lng], 16, { animate: false });
    }, [position.lat, position.lng]);
    return null;
  }

  // Sugerencia: cuando la dirección se autogenera por click,
  // NO queremos que “Buscar” cambie el punto si el usuario no editó nada.
  // Por eso el input manual va separado.
  // Si querés, podés precargar el manualQuery con address, pero eso causa justo el bug que dijiste.
  // Aquí queda correcto: manualQuery solo cambia si usuario escribe.

  const icon = (L as any).__INVERSAN_ICON__;

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={manualQuery}
          onPressEnter={geocodeManual}
          onChange={(e) => setManualQuery(e.target.value)}
          placeholder="Buscar dirección manual (opcional)…"
          className="flex-1"
        />
        <Button
          icon={<SearchOutlined />}
          onClick={geocodeManual}
          loading={searchLoading}
          className="!border-[#027EB1] !text-[#027EB1]"
        >
          Buscar
        </Button>
      </div>

      <div className="w-full flex-1 min-h-[240px] rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={[value.lat, value.lng]}
          zoom={16}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={false}
          zoomControl={true}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          minZoom={7}
          maxZoom={19}
        >
          <RecenterMap position={value} />

          <TileLayer
            // OSM estándar (ligero). Si querés aún más ligero, podemos usar un tile proveedor “light”,
            // pero esto ya va bien y el gran ahorro está en el lazy-load.
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <ClickHandler />
          <Marker position={[value.lat, value.lng]} icon={icon} />
        </MapContainer>
      </div>
      <div className="text-xs text-slate-500">
        Tip: click en el mapa para mover el pin (actualiza dirección). “Buscar” es solo si escribiste manualmente.
      </div>
    </div>
  );
}

// ================================
// Página
// ================================
export default function Sucursales() {
  const [branches, setBranches] = useState<Sucursal[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [q, setQ] = useState("");
  const [bod, setBod] = useState("");
  const [statusFilter, setStatusFilter] = useState<BranchStatus | "">("");
  const [sucursalFilter, setSucursalFilter] = useState<number | null>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toggleBranchOpen, setToggleBranchOpen] = useState(false);
  const [toggleBodegaOpen, setToggleBodegaOpen] = useState(false);
  const [createOpenBod, setCreateOpenBod] = useState(false);
  const [editOpenBod, setEditOpenBod] = useState(false);


  const [selected, setSelected] = useState<Sucursal | null>(null);
  const [selectedBod, setSelectedBod] = useState<Bodega | null>(null);
  const [nextBranchStatus, setNextBranchStatus] = useState<boolean | null>(null);
  const [nextBodegaStatus, setNextBodegaStatus] = useState<boolean | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [deactivateForm] = Form.useForm();
  const [createFormBod] = Form.useForm();
  const [editFormBod] = Form.useForm();

  const [confirmLoading, setConfirmLoading] = useState(false);

  // Watches para mapa
  const createLat = Form.useWatch("lat", createForm);
  const createLng = Form.useWatch("lng", createForm);
  const createAddress = Form.useWatch("location", createForm) || "";
  const createCity = Form.useWatch("city", createForm) || "Santa Rosa de Copán";
  const createState = Form.useWatch("state", createForm) || "Copán";

  const editLat = Form.useWatch("lat", editForm);
  const editLng = Form.useWatch("lng", editForm);
  const editAddress = Form.useWatch("location", editForm) || "";
  const editCity = Form.useWatch("city", editForm) || "";
  const editState = Form.useWatch("state", editForm) || "";

  //Watch de sucursal
  const selectedBranchId = Form.useWatch("sucursal", createFormBod);
  const selectedBranchIdEdit = Form.useWatch("sucursal", editFormBod);

  const selectedBranch = branches.find(
    (b) => b.id_sucursal === selectedBranchId
  );
  const selectedBranchEdit = branches.find(
    (b) => b.id_sucursal === selectedBranchIdEdit
  );

  //pagination
  const [currentPageSuc, setCurrentPageSuc] = useState(1);
  const [currentPageBod, setCurrentPageBod] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const sucursales = await getAllBranches();
        setBranches(sucursales);
        const depots = await getAllBodegas();
        setBodegas(depots);


      } finally {
        setLoading(false);
      }
    })();
    const fetchUsers = async () => {
      setUsersLoading(true);
      const data = await getUsers();
      const filteredUsers = data.filter((user) => [1, 2, 3].includes(user.id_rol))
      setUsers(filteredUsers);
      setUsersLoading(false);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    async function loadEmployeeCounts() {
      const counts: Record<number, number> = {};

      for (const branch of branches) {
        const count = await getEmployeeCountForBranch(branch.id_sucursal);
        counts[branch.id_sucursal] = count;
      }

      setEmployeeCounts(counts);
    }

    if (branches.length > 0) {
      loadEmployeeCounts();
    }
  }, [branches])

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return branches.filter((b) => {
      const matchesText =
        !text ||
        b.nombre.toLowerCase().includes(text) ||
        `${b.usuario.primer_nombre} ${b.usuario.primer_apellido}`.toLowerCase().includes(text) ||
        b.municipio.nombre.toLowerCase().includes(text) ||
        b.municipio.departamento.nombre_departamento.toLowerCase().includes(text) ||
        String(b.RTN).includes(text);

      const matchesStatus = !statusFilter || b.activo === (statusFilter === "Activo");
      return matchesText && matchesStatus;
    });
  }, [branches, q, statusFilter]);

  const filteredBodegas = useMemo(() => {
    const text = bod.trim().toLowerCase();

    return bodegas.filter((b) => {
      const matchesText =
        !text ||
        b.nombre.toLowerCase().includes(text);
      const matchesSucursal = !sucursalFilter || b.id_sucursal == sucursalFilter;
      const matchesStatus = !statusFilter || b.activo === (statusFilter === "Activo");
      return matchesText && matchesStatus && matchesSucursal;
    });
  }, [bodegas, bod, statusFilter, sucursalFilter]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      name: "",
      location: "",
      lat: SANTA_ROSA_COPAN.lat,
      lng: SANTA_ROSA_COPAN.lng,
    });
    setCreateOpen(true);
  };

  const openCreateBod = () => {
    createFormBod.resetFields();
    createFormBod.setFieldsValue({
      nombre: "",
      sucursal: "",
    });
    setCreateOpenBod(true);
  };

  const openEdit = (b: Sucursal) => {
    setSelected(b);
    editForm.setFieldsValue({
      name: b.nombre,
      RTN: b.RTN,
      manager: `${b.usuario.primer_nombre} ${b.usuario.primer_apellido}`,
      location: b.direccion,
      lat: b.lat,
      lng: b.lng,
      city: b.municipio.nombre,
      state: b.municipio.departamento.nombre_departamento
    });
    setEditOpen(true);
  };

  const openEditBod = (b: Bodega) => {
    setSelectedBod(b);
    editFormBod.setFieldsValue({
      nombre: b.nombre,
      sucursal: b.id_sucursal
    });
    setEditOpenBod(true);
  }

  const openToggleBranch = (b: Sucursal) => {
    setSelected(b);
    deactivateForm.resetFields();
    setNextBranchStatus(!b.activo);
    setToggleBranchOpen(true);
  };

  const openToggleBod = (b: Bodega) => {
    setSelectedBod(b);
    setNextBodegaStatus(!isBodegaActive(b));
    setToggleBodegaOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setLoading(true);
      try {
        const res = await createBranch(values);

        if (!res) {
          message.error("No se pudo obtener la sucursal creada");
          return;
        }

        const newBranchID: number = res.sucursal.data.id_sucursal;

        const branchResult = await getBranch(newBranchID);
        if (!branchResult) {
          message.error("No se pudo obtener la sucursal creada");
          return;
        }

        const newBranch: Sucursal = branchResult;
        const bodega: Bodega = {
          id_bodega: res.bodega.data.id_bodega,
          nombre: res.bodega.data.nombre,
          activo: res.bodega.data.activo ?? true,
          id_sucursal: res.bodega.data.id_sucursal,
          sucursal: { nombre: newBranch.nombre, activo: newBranch.activo }
        }

        setBranches((prev) => [newBranch, ...prev]);
        setBodegas((prev) => [bodega, ...prev])
        window.dispatchEvent(new Event(BRANCHES_UPDATED_EVENT));
        message.success("Sucursal creada");
        setCreateOpen(false);
        createForm.resetFields();
      } finally {
        setLoading(false);
      }
    } catch {
      return;
    }
  };

  const handleEdit = async () => {
    if (!selected) return;

    try {
      const values = await editForm.validateFields();
      setLoading(true);
      try {
        const res = await updateBranch(selected.id_sucursal, values);

        setBranches((prev) =>
          prev.map((b) =>
            b.id_sucursal === selected.id_sucursal
              ? {
                ...b,
                nombre: values.name,
                id_usuario: values.manager,
                direccion: values.location,
                lat: Number(values.lat),
                lng: Number(values.lng),
                id_municipio: res.data.id_municipio
              }
              : b
          )
        );

        message.success("Sucursal actualizada");
        window.dispatchEvent(new Event(BRANCHES_UPDATED_EVENT));
        setEditOpen(false);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    } catch {
      return;
    }
  };

  const handleCreateBod = async () => {
    try {
      const values = await createFormBod.validateFields();
      setLoading(true);
      try {
        const res = await createBodega(values);

        if (!res) {
          message.error("No se pudo obtener la bodega creada");
          return;
        }

        const newBodegaID: number = res.data.id_bodega;

        const bodega = await getBodega(newBodegaID);

        if (!bodega) {
          message.error("No se pudo obtener la bodega creada");
          return;
        }

        setBodegas((prev) => [bodega, ...prev])
        message.success("Sucursal creada");
        setCreateOpenBod(false);
        createFormBod.resetFields();
      } finally {
        setLoading(false);
      }
    } catch {
      return;
    }
  };

  const handleEditBod = async () => {
    if (!selectedBod) return;

    try {
      const values = await editFormBod.validateFields();
      setLoading(true);
      try {
        const res = await updateBodega(selectedBod.id_bodega, values);

        if (!res) {
          message.error("No se pudo actualizar la bodega")
          return;
        }

        const newBodegaRes = await getBodega(res.data.id_bodega);

        if (!newBodegaRes) {
          message.error("No se pudo obtener la la bodega")
          return;
        }

        setBodegas((prev) =>
          prev.map((b) =>
            b.id_bodega === selectedBod.id_bodega
              ? {
                ...b,
                nombre: values.nombre,
                id_sucursal: values.sucursal,
                sucursal: {
                  nombre: newBodegaRes.sucursal.nombre,
                  activo: newBodegaRes.sucursal.activo
                }
              }
              : b
          )
        );

        message.success("Sucursal actualizada");
        setEditOpenBod(false);
        setSelectedBod(null);
      } finally {
        setLoading(false);
      }
    } catch {
      return;
    }
  };

  const handleToggleBranch = async () => {
    if (!selected || nextBranchStatus === null) return;

    setConfirmLoading(true);
    try {
      const res = await toggleBranchStatus(selected.id_sucursal, nextBranchStatus);

      if (!res) {
        message.error("No se pudo actualizar la sucursal");
        return;
      }

      setBranches((prev) =>
        prev.map((b) =>
          b.id_sucursal === selected.id_sucursal ? { ...b, activo: nextBranchStatus } : b,
        )
      );
      setBodegas((prev) =>
        prev.map((b) =>
          b.id_sucursal === selected.id_sucursal
            ? { ...b, sucursal: { ...b.sucursal, activo: nextBranchStatus } }
            : b,
        )
      );

      if (!nextBranchStatus) {
        const savedBranch = Number(localStorage.getItem(BRANCH_STORAGE_KEY) || "0");
        if (savedBranch === selected.id_sucursal) {
          localStorage.setItem(BRANCH_STORAGE_KEY, "0");
          window.dispatchEvent(new Event(BRANCH_CHANGED_EVENT));
        }
      }

      window.dispatchEvent(new Event(BRANCHES_UPDATED_EVENT));
      message.success(nextBranchStatus ? "Sucursal reactivada" : "Sucursal desactivada");
      setToggleBranchOpen(false);
      setSelected(null);
      setNextBranchStatus(null);
    } catch (error) {
      message.error("Error actualizando sucursal");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleToggleBodega = async () => {
    if (!selectedBod || nextBodegaStatus === null) return;

    setConfirmLoading(true);
    try {
      const res = await toggleBodegaStatus(selectedBod.id_bodega, nextBodegaStatus);

      if (!res) {
        message.error("No se pudo actualizar la bodega");
        return;
      }

      setBodegas((prev) =>
        prev.map((b) =>
          b.id_bodega === selectedBod.id_bodega
            ? { ...b, activo: nextBodegaStatus }
            : b,
        ),
      );

      message.success(nextBodegaStatus ? "Bodega reactivada" : "Bodega desactivada");
      setToggleBodegaOpen(false);
      setSelectedBod(null);
      setNextBodegaStatus(null);
    } catch {
      message.error("Error actualizando bodega");
    } finally {
      setConfirmLoading(false);
    }
  };

  // ================================
  // Tabla Desktop
  // ================================
  const columns: DataTableColumn<Sucursal>[] = [
    { title: "CODIGO", dataIndex: "id_sucursal", key: "id_sucursal", width: 90 },
    {
      title: "NOMBRE", dataIndex: "nombre", key: "nombre", render: (_, v) => <span className="font-semibold text-slate-700">{v.nombre}</span>,
    },
    { title: "ENCARGADO", key: "gerente", width: 220, render: (_, b: Sucursal) => `${b.usuario.primer_nombre} ${b.usuario.primer_apellido}` },
    { title: "UBICACIÓN", key: "direccion", width: 260, render: (_, b: Sucursal) => `${b.municipio.nombre}, ${b.municipio.departamento.nombre_departamento}` },
    {
      title: "EMPLEADOS",
      key: "employees",
      render: (_: any, branch: Sucursal) => {
        const count = employeeCounts[branch.id_sucursal] || 0;
        return <span>{count}</span>;
      },
    },
    {
      title: "ESTADO",
      key: "activo",
      width: 120,
      render: (_, b: Sucursal) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={Boolean(b.activo)}
            onChange={(checked) => {
              if (!checked) {
                openToggleBranch(b);
              } else {
                setSelected(b);
                setNextBranchStatus(true);
                // Call handleToggleBranch directly or similar
                // For simplicity, I'll use the existing modal for both since it's already there
                // BUT the user said "funcione como en categoria", which means direct activation.
                // I'll add a check in handleToggleBranch or make a separate call.
                // Actually, I'll just call the API directly here if activating.
                const performToggle = async () => {
                  try {
                    const res = await toggleBranchStatus(b.id_sucursal, true);
                    if (res) {
                      setBranches((prev) =>
                        prev.map((item) =>
                          item.id_sucursal === b.id_sucursal ? { ...item, activo: true } : item,
                        )
                      );
                      window.dispatchEvent(new Event(BRANCHES_UPDATED_EVENT));
                      message.success("Sucursal reactivada");
                    }
                  } catch (error) {
                    message.error("Error actualizando sucursal");
                  }
                };
                performToggle();
              }
            }}
            style={{ backgroundColor: b.activo ? "#16A34A" : "#D1D5DB" }}
          />
        </div>
      ),
    },
    {
      title: "ACCIONES",
      key: "actions",
      width: 80,
      render: (_: any, b: Sucursal) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="text-blue-500 hover:text-blue-700 transition-colors"
            onClick={() => openEdit(b)} >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  const columnsBodega: DataTableColumn<Bodega>[] = [
    { title: "CÓDIGO", dataIndex: "id_bodega", key: "id_sucursal", width: 90 },
    {
      title: "NOMBRE", dataIndex: "nombre", key: "nombre", render: (_, v: Bodega) => <span className="font-semibold text-slate-700">{v.nombre}</span>,
    },
    { title: "SUCURSAL", key: "id_sucursal", render: (_, b: Bodega) => b.sucursal.nombre },
    {
      title: "ESTADO",
      key: "activo",
      width: 120,
      render: (_, b: Bodega) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={Boolean(isBodegaActive(b))}
            onChange={(checked) => {
              if (!checked) {
                openToggleBod(b);
              } else {
                const performToggle = async () => {
                  try {
                    const res = await toggleBodegaStatus(b.id_bodega, true);
                    if (res) {
                      setBodegas((prev) =>
                        prev.map((item) =>
                          item.id_bodega === b.id_bodega ? { ...item, activo: true } : item,
                        ),
                      );
                      message.success("Bodega reactivada");
                    }
                  } catch (error) {
                    message.error("Error actualizando bodega");
                  }
                };
                performToggle();
              }
            }}
            style={{ backgroundColor: isBodegaActive(b) ? "#16A34A" : "#D1D5DB" }}
          />
        </div>
      ),
    },
    {
      title: "ACCIONES",
      key: "actions",
      width: 80,
      render: (_: any, b: Bodega) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="text-blue-500 hover:text-blue-700 transition-colors"
            onClick={() => openEditBod(b)} >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  //Pagination variables Sucursales
  const totalPagesSuc = Math.max(1, Math.ceil(filtered.length / 8));
  const safeCurrentPageSuc = Math.min(currentPageSuc, totalPagesSuc);
  const paginatedSuc = filtered.slice(
    (safeCurrentPageSuc - 1) * 8,
    safeCurrentPageSuc * 8);

  //Pagination variables Bodegas
  const totalPagesBod = Math.max(1, Math.ceil(filteredBodegas.length / 8));
  const safeCurrentPageBod = Math.min(currentPageBod, totalPagesBod);
  const paginatedBod = filteredBodegas.slice(
    (safeCurrentPageBod - 1) * 8,
    safeCurrentPageBod * 8
  );
  return (
  <ConfigProvider>
    <div className="w-full bg-[#F5F7FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header del módulo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">Administración de Sucursales</div>
              <div className="text-sm text-slate-500 mt-1">
                Administra la información de las sucursales, asigna el encargado y supervisa el estado de actividad de cada sucursal en la plataforma.
              </div>
            </div>
          </div>

          {/* Buscador + filtros + crear */}
          <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center">
            <FilterBar
              search={{
                value: q,
                onChange: setQ,
                placeholder: "Buscar sucursal por nombre, ubicación, encargado...",
              }}
              filters={[
                {
                  placeholder: "Filtrar por Estado",
                  value: statusFilter || undefined,
                  onChange: (v) => setStatusFilter((v as any) || ""),
                  options: STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
                }
              ]}
              onClear={() => (setStatusFilter(""))}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="bg-[#027EB1] w-full md:w-auto !h-12 !rounded-xl !border-none !bg-[#027EB1] hover:!bg-[#026a96] !text-base !font-semibold !min-w-0"
                onClick={openCreate}
              >
                Crear Sucursal
              </Button>
            </FilterBar>
          </div>

          {/* Desktop: tabla sucursales */}
          <DataTable<Sucursal>
            rowKey="id"
            columns={columns}
            dataSource={paginatedSuc}
            loading={loading}
            pagination={{
              current: safeCurrentPageSuc,
              pageSize: 8,
              total: filtered.length,
              onChange: (page) => setCurrentPageSuc(page),
            }}
            className="hidden md:block mt-2 rounded-2xl"
          />

          {/* Mobile: cards sucursales*/}
          {filtered.map((b) => (
            <div key={b.id_sucursal} className="md:hidden mt-5 flex flex-col gap-3    bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{b.nombre}</div>
                  <div className="text-xs text-slate-500 mt-1">{b.direccion}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => openEdit(b)} >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Código</div>
                <div className="text-slate-700 text-right">{b.id_sucursal}</div>

                <div className="text-slate-500">Encargado</div>
                <div className="text-slate-700 text-right">{b.id_usuario}</div>

                <div className="text-slate-500">Empleados</div>
                <div className="text-slate-700 text-right">
                  {employeeCounts[b.id_sucursal] ?? 0}
                </div>

                <div className="text-slate-500">Estado</div>
                <div className="text-right">
                  <Switch
                    checked={Boolean(b.activo)}
                    onChange={(checked) => {
                      if (!checked) {
                        openToggleBranch(b);
                      } else {
                        const performToggle = async () => {
                          try {
                            const res = await toggleBranchStatus(b.id_sucursal, true);
                            if (res) {
                              setBranches((prev) =>
                                prev.map((item) =>
                                  item.id_sucursal === b.id_sucursal ? { ...item, activo: true } : item,
                                )
                              );
                              window.dispatchEvent(new Event(BRANCHES_UPDATED_EVENT));
                              message.success("Sucursal reactivada");
                            }
                          } catch (error) {
                            message.error("Error actualizando sucursal");
                          }
                        };
                        performToggle();
                      }
                    }}
                    style={{ backgroundColor: b.activo ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Header del módulo Bodegas*/}
        <div className="bg-white mt-5 rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">Administración de Bodegas</div>
              <div className="text-sm text-slate-500 mt-1">
                Administra la información de las bodega y la sucursal asociada a la bodega.
              </div>
            </div>
          </div>

          {/* Buscador + filtros + crear */}
          <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center">
            <FilterBar
              search={{
                value: bod,
                onChange: setBod,
                placeholder: "Buscar bodega por nombre...",
              }}
              filters={[
                {
                  placeholder: "Filtrar por Sucursal",
                  value: sucursalFilter || undefined,
                  onChange: (v) => setSucursalFilter((v as any) || ""),
                  options: bodegas.map((b) => ({
                    value: b.id_sucursal,
                    label: b.sucursal.nombre
                  }))
                }
              ]}
              onClear={() => (setSucursalFilter(null))}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="bg-[#027EB1] w-full md:w-auto !h-12 !rounded-xl !border-none !bg-[#027EB1] hover:!bg-[#026a96] !text-base !font-semibold !min-w-0"
                onClick={openCreateBod}
              >
                Crear Bodega
              </Button>
            </FilterBar>
          </div>

          {/* Desktop: tabla bodegas*/}
          <DataTable<Bodega>
            rowKey="id"
            columns={columnsBodega}
            dataSource={paginatedBod}
            loading={loading}
            pagination={{
              current: safeCurrentPageBod,
              pageSize: 8,
              total: filteredBodegas.length,
              onChange: (page) => setCurrentPageBod(page),
            }}
            className="hidden md:block mt-2 rounded-2xl"
          />
          {/* Mobile: cards */}
          {filteredBodegas.map((b) => (
            <div key={b.id_bodega} className="md:hidden mt-5 flex flex-col gap-3    bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{b.nombre}</div>
                  <div className="text-xs text-slate-500 mt-1">{b.sucursal.nombre}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => openEditBod(b)} >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Código</div>
                <div className="text-slate-700 text-right">{b.id_bodega}</div>

                <div className="text-slate-500">Estado</div>
                <div className="text-right">
                  <Switch
                    checked={Boolean(isBodegaActive(b))}
                    onChange={(checked) => {
                      if (!checked) {
                        openToggleBod(b);
                      } else {
                        const performToggle = async () => {
                          try {
                            const res = await toggleBodegaStatus(b.id_bodega, true);
                            if (res) {
                              setBodegas((prev) =>
                                prev.map((item) =>
                                  item.id_bodega === b.id_bodega ? { ...item, activo: true } : item,
                                ),
                              );
                              message.success("Bodega reactivada");
                            }
                          } catch (error) {
                            message.error("Error actualizando bodega");
                          }
                        };
                        performToggle();
                      }
                    }}
                    style={{ backgroundColor: isBodegaActive(b) ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================
          Modal Crear (mapa lazy)
        ================================ */}
      <Modal
        title={<div className="text-lg font-bold">Crear</div>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={860}
        confirmLoading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Form form={createForm} layout="vertical">
            <Form.Item
              label="Nombre Sucursal *"
              name="name"
              rules={[{ required: true, message: "Ingresa el nombre de la sucursal" }]}
            >
              <Input placeholder="Sucursal Norte" />
            </Form.Item>
            <Form.Item
              label="RTN *"
              name="RTN"
              rules={[{ required: true, message: "Ingresa el RTN de la sucursal" }]}
            >
              <Input placeholder="05019999123456" />
            </Form.Item>
            <Form.Item
              label="Encargado *"
              name="manager"
              rules={[{ required: true, message: "Selecciona un encargado" }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un encargado"
                loading={usersLoading}
                options={users.map((u) => ({
                  value: u.id_usuario,
                  label: `${u.primer_nombre} ${u.primer_apellido}`
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Ubicación (Dirección) *"
              name="location"
              rules={[{ required: true, message: "Ingresa la dirección" }]}
            >
              <Input.TextArea placeholder="Dirección / referencia..." rows={4} readOnly />
            </Form.Item>

            {/* hidden lat/lng/city */}
            <Form.Item name="lat" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="lng" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="city" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="state" hidden>
              <Input />
            </Form.Item>

            <div className="text-xs text-slate-500">
              Coordenadas:{" "}
              <span className="font-semibold text-slate-700">
                {Number(createLat || 0).toFixed(6)}, {Number(createLng || 0).toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Ciudad:{" "}
              <span className="font-semibold text-slate-700">
                {`${createCity}, ${createState}`}
              </span>
            </div>
          </Form>

          {/* ✅ Mapa solo carga cuando el modal está abierto */}
          <MapPickerLazy
            country="Honduras"
            value={{
              lat: Number(createLat ?? SANTA_ROSA_COPAN.lat),
              lng: Number(createLng ?? SANTA_ROSA_COPAN.lng),
            }}
            onChange={(p) => {
              createForm.setFieldValue("lat", p.lat);
              createForm.setFieldValue("lng", p.lng);
            }}
            address={createAddress}
            onAddressChange={(addr) => createForm.setFieldValue("location", addr)}
            onCityChange={({ city, state }) => {
              createForm.setFieldValue("city", city);
              createForm.setFieldValue("state", state);
            }}
          />
        </div>
      </Modal>

      {/* ================================
          Modal Editar (mapa lazy)
        ================================ */}
      <Modal
        title={<div className="text-lg font-bold">Editar</div>}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onOk={handleEdit}
        okText="Guardar"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={860}
        confirmLoading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="Nombre Sucursal *"
              name="name"
              rules={[{ required: true, message: "Ingresa el nombre de la sucursal" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="RTN *"
              name="RTN"
              rules={[{ required: true, message: "Ingresa el RTN de la sucursal" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Encargado *"
              name="manager"
              rules={[{ required: true, message: "Ingresa el encargado" }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un encargado"
                loading={usersLoading}
                options={users.map((u) => ({
                  value: u.id_usuario,
                  label: `${u.primer_nombre} ${u.primer_apellido}`
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Ubicación (Dirección) *"
              name="location"
              rules={[{ required: true, message: "Ingresa la dirección" }]}
            >
              <Input.TextArea rows={4} readOnly />
            </Form.Item>

            {/* hidden lat/lng */}
            <Form.Item name="lat" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="lng" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="city" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="state" hidden>
              <Input />
            </Form.Item>

            <div className="text-xs text-slate-500">
              Coordenadas:{" "}
              <span className="font-semibold text-slate-700">
                {Number(editLat || 0).toFixed(6)}, {Number(editLng || 0).toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Ciudad:{" "}
              <span className="font-semibold text-slate-700">
                {`${editCity}, ${editState}`}
              </span>
            </div>
          </Form>

          {/* ✅ En editar SIEMPRE centra donde está el marcador guardado */}
          <MapPickerLazy
            country="Honduras"
            value={{
              lat: Number(editLat ?? selected?.lat ?? SANTA_ROSA_COPAN.lat),
              lng: Number(editLng ?? selected?.lng ?? SANTA_ROSA_COPAN.lng),
            }}
            onChange={(p) => {
              editForm.setFieldValue("lat", p.lat);
              editForm.setFieldValue("lng", p.lng);
            }}
            address={editAddress}
            onAddressChange={(addr) => editForm.setFieldValue("location", addr)}
            onCityChange={({ city, state }) => {
              editForm.setFieldValue("city", city);
              editForm.setFieldValue("state", state);
            }}
          />
        </div>
      </Modal>

      {/* ================================
        Modal Activar/Desactivar sucursal
        ================================ */}
      <Modal
        open={toggleBranchOpen}
        onCancel={() => {
          setToggleBranchOpen(false);
          setSelected(null);
          setNextBranchStatus(null);
        }}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div className="bg-white rounded-2xl w-full mx-auto p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${nextBranchStatus ? 'bg-blue-50' : 'bg-red-50'}`}>
              {nextBranchStatus ? (
                <RotateCcw className="w-6 h-6 text-blue-500" />
              ) : (
                <TriangleAlert className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          <h2 className="text-gray-900 font-bold text-lg mb-2">
            {nextBranchStatus ? "Reactivar Sucursal" : "Desactivar Sucursal"}
          </h2>

          <p className="text-sm text-gray-600 mb-1">
            ¿Estás seguro que deseas {nextBranchStatus ? "reactivar" : "desactivar"} la sucursal{" "}
            <span className="text-gray-900 font-semibold">'{selected?.nombre}'</span>?
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {nextBranchStatus
              ? "La sucursal volverá a estar disponible en el sistema."
              : "La sucursal dejará de estar disponible en el sistema."}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setToggleBranchOpen(false);
                setSelected(null);
                setNextBranchStatus(null);
              }}
              className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleToggleBranch}
              disabled={confirmLoading}
              className={`w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm transition-colors order-1 md:order-2 font-medium disabled:opacity-70 ${nextBranchStatus ? 'bg-[#027EB1] hover:bg-[#026691]' : 'bg-[#DC2626] hover:bg-red-700'
                }`}
            >
              {nextBranchStatus ? "Reactivar" : "Desactivar"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={toggleBodegaOpen}
        onCancel={() => {
          setToggleBodegaOpen(false);
          setSelectedBod(null);
          setNextBodegaStatus(null);
        }}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div className="bg-white rounded-2xl w-full mx-auto p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${nextBodegaStatus ? 'bg-blue-50' : 'bg-red-50'}`}>
              {nextBodegaStatus ? (
                <RotateCcw className="w-6 h-6 text-blue-500" />
              ) : (
                <TriangleAlert className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          <h2 className="text-gray-900 font-bold text-lg mb-2">
            {nextBodegaStatus ? "Reactivar Bodega" : "Desactivar Bodega"}
          </h2>

          <p className="text-sm text-gray-600 mb-1">
            ¿Estás seguro que deseas {nextBodegaStatus ? "reactivar" : "desactivar"} la bodega{" "}
            <span className="text-gray-900 font-semibold">'{selectedBod?.nombre}'</span>?
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {nextBodegaStatus
              ? "La bodega volverá a estar disponible para operar."
              : "La bodega dejará de estar disponible para operar."}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setToggleBodegaOpen(false);
                setSelectedBod(null);
                setNextBodegaStatus(null);
              }}
              className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleToggleBodega}
              disabled={confirmLoading}
              className={`w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm transition-colors order-1 md:order-2 font-medium disabled:opacity-70 ${nextBodegaStatus ? 'bg-[#027EB1] hover:bg-[#026691]' : 'bg-[#DC2626] hover:bg-red-700'
                }`}
            >
              {nextBodegaStatus ? "Reactivar" : "Desactivar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================
        Modal Crear Bodega
      ================================ */}
      <Modal
        title={<div className="text-lg font-bold">Crear Bodega</div>}
        open={createOpenBod}
        onCancel={() => setCreateOpenBod(false)}
        onOk={handleCreateBod}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={860}
        confirmLoading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Form form={createFormBod} layout="vertical">
            <Form.Item
              label="Nombre Bodega *"
              name="nombre"
              rules={[{ required: true, message: "Ingresa el nombre de la sucursal" }]}
            >
              <Input placeholder="Bodega de Sucursal Norte" />
            </Form.Item>
            <Form.Item
              label="Sucursal *"
              name="id_sucursal"
              rules={[{ required: true, message: "Selecciona un encargado" }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un encargado"
                loading={loading}
                options={branches.map((b) => ({
                  value: b.id_sucursal,
                  label: b.nombre
                }))}
              />
            </Form.Item>
          </Form>
          {/* Información de la sucursal */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Información de la sucursal</h3>

            {selectedBranch ? (
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {selectedBranch.nombre}</p>
                <p><strong>Ciudad:</strong> {selectedBranch.municipio.nombre}</p>
                <p><strong>Departamento:</strong> {selectedBranch.municipio.departamento.nombre_departamento}</p>
                <p><strong>Dirección:</strong> {selectedBranch.direccion}</p>
                <p><strong>RTN:</strong> {selectedBranch.RTN}</p>
              </div>
            ) : (
              <p className="text-gray-400">Selecciona una sucursal para ver su información</p>
            )}
          </div>
        </div>
      </Modal>

      {/* ================================
        Modal Editar Bodega
      ================================ */}
      <Modal
        title={<div className="text-lg font-bold">Editar</div>}
        open={editOpenBod}
        onCancel={() => {
          setEditOpenBod(false);
          setSelectedBod(null);
        }}
        onOk={handleEditBod}
        okText="Guardar"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={860}
        confirmLoading={loading}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Form form={editFormBod} layout="vertical">
            <Form.Item
              label="Nombre Bodega *"
              name="nombre"
              rules={[{ required: true, message: "Ingresa el nombre de la sucursal" }]}
            >
              <Input placeholder="Bodega de Sucursal Norte" />
            </Form.Item>
            <Form.Item
              label="Sucursal *"
              name="sucursal"
              rules={[{ required: true, message: "Selecciona un encargado" }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un encargado"
                loading={loading}
                options={branches.map((b) => ({
                  value: b.id_sucursal,
                  label: b.nombre
                }))}
              />
            </Form.Item>
          </Form>
          {/* Información de la sucursal */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Información de la sucursal</h3>

            {selectedBranchEdit ? (
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {selectedBranchEdit.nombre}</p>
                <p><strong>Ciudad:</strong> {selectedBranchEdit.municipio.nombre}</p>
                <p><strong>Departamento:</strong> {selectedBranchEdit.municipio.departamento.nombre_departamento}</p>
                <p><strong>Dirección:</strong> {selectedBranchEdit.direccion}</p>
                <p><strong>RTN:</strong> {selectedBranchEdit.RTN}</p>
              </div>
            ) : (
              <p className="text-gray-400">Selecciona una sucursal para ver su información</p>
            )}

          </div>
        </div>
      </Modal>
    </div>
  </ConfigProvider>
  );
}
