import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Tag, message } from "antd";
import dayjs from "dayjs";
import {
  getAttendanceContext,
  getAttendanceDay,
  saveAttendance,
  type AttendanceContext,
  type AttendanceEmployeeDay,
} from "../../api/attendance/attendance";

const today = dayjs().format("YYYY-MM-DD");

function getPenaltyLabel(categoria: string, horas: number) {
  if (categoria === "puntual") return "Puntual";
  if (categoria === "penalizacion_1h") return "Penalización 1 hora";
  if (categoria === "penalizacion_2h") return "Penalización 2 horas";
  if (categoria === "falta_jornada") return "Penalización 8 horas";
  if (horas > 0) return `${horas} horas faltadas`;
  return "Sin registro";
}

function getPenaltyColor(categoria: string) {
  if (categoria === "puntual") return "green";
  if (categoria === "penalizacion_1h") return "gold";
  if (categoria === "penalizacion_2h") return "orange";
  if (categoria === "falta_jornada") return "red";
  return "default";
}

function calculatePreview(hora: string) {
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return { categoria: "sin_registro", horas: 0 };
  }

  const [hours, minutes] = hora.split(":").map(Number);
  const total = hours * 60 + minutes;

  if (total <= 7 * 60 + 30) return { categoria: "puntual", horas: 0 };
  if (total <= 7 * 60 + 40) return { categoria: "penalizacion_1h", horas: 1 };
  if (total <= 7 * 60 + 50) return { categoria: "penalizacion_2h", horas: 2 };
  return { categoria: "falta_jornada", horas: 8 };
}

export default function MarkAttendance() {
  const [msg, contextHolder] = message.useMessage();
  const [context, setContext] = useState<AttendanceContext | null>(null);
  const [branchId, setBranchId] = useState<number | undefined>();
  const [fecha, setFecha] = useState(today);
  const [employees, setEmployees] = useState<AttendanceEmployeeDay[]>([]);
  const [hoursByUser, setHoursByUser] = useState<Record<number, string>>({});
  const [observationsByUser, setObservationsByUser] = useState<Record<number, string>>({});
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const branchOptions = useMemo(
    () =>
      (context?.sucursales || []).map((branch) => ({
        value: branch.id_sucursal,
        label: branch.nombre,
      })),
    [context],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingContext(true);

    void getAttendanceContext()
      .then((data) => {
        if (cancelled) return;
        setContext(data);
        setBranchId(data.defaultBranchId ?? undefined);
      })
      .catch(() => {
        if (!cancelled) msg.error("No se pudo cargar el contexto de asistencia");
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [msg]);

  useEffect(() => {
    if (!branchId) return;

    let cancelled = false;
    setLoadingDay(true);

    void getAttendanceDay({ id_sucursal: branchId, fecha })
      .then((data) => {
        if (cancelled) return;
        setEmployees(data.empleados);
        setHoursByUser(
          Object.fromEntries(data.empleados.map((employee) => [employee.id_usuario, employee.hora_entrada || ""])),
        );
        setObservationsByUser(
          Object.fromEntries(data.empleados.map((employee) => [employee.id_usuario, employee.observacion || ""])),
        );
      })
      .catch(() => {
        if (!cancelled) msg.error("No se pudo cargar la asistencia del día");
      })
      .finally(() => {
        if (!cancelled) setLoadingDay(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, fecha, msg]);

  const handleSave = async () => {
    if (!branchId) {
      msg.warning("Seleccione una sucursal");
      return;
    }

    if (employees.length === 0) {
      msg.warning("No hay empleados activos asignados a esta sucursal");
      return;
    }

    const missingEmployee = employees.find((employee) => !hoursByUser[employee.id_usuario]);
    if (missingEmployee) {
      msg.warning(`Ingrese la hora de entrada de ${missingEmployee.nombre}`);
      return;
    }

    setSaving(true);
    try {
      await saveAttendance({
        id_sucursal: branchId,
        fecha,
        asistencias: employees.map((employee) => ({
          id_usuario: employee.id_usuario,
          hora_entrada: hoursByUser[employee.id_usuario],
          observacion: observationsByUser[employee.id_usuario] || null,
        })),
      });

      msg.success("Asistencia guardada correctamente");
      const refreshed = await getAttendanceDay({ id_sucursal: branchId, fecha });
      setEmployees(refreshed.empleados);
      setHoursByUser(
        Object.fromEntries(refreshed.empleados.map((employee) => [employee.id_usuario, employee.hora_entrada || ""])),
      );
      setObservationsByUser(
        Object.fromEntries(refreshed.empleados.map((employee) => [employee.id_usuario, employee.observacion || ""])),
      );
    } catch {
      msg.error("No se pudo guardar la asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] px-4 py-8">
      {contextHolder}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[#D7E3F0] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#027EB1]">
                Gestión de empleados
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#003E7B]">Marcar asistencia</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Registre la hora de entrada de cada empleado activo de la sucursal. La sucursal queda bloqueada salvo para usuarios con privilegio de administrar asistencia.
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              loading={saving}
              onClick={handleSave}
              className="bg-[#027EB1]"
            >
              Guardar asistencia
            </Button>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-[#D7E3F0] bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Sucursal</label>
            <Select
              className="w-full"
              size="large"
              loading={loadingContext}
              disabled={!context?.canAdministrarAsistencia}
              value={branchId}
              options={branchOptions}
              placeholder="Seleccione una sucursal"
              onChange={(value: number) => setBranchId(value)}
            />
            {!context?.canAdministrarAsistencia && (
              <p className="mt-2 text-xs text-slate-500">
                Bloqueado por sucursal asignada al usuario.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha</label>
            <Input
              size="large"
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value || today)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#D7E3F0] bg-white shadow-sm">
          <div className="border-b border-[#E5EDF6] px-5 py-4">
            <h2 className="text-lg font-bold text-[#003E7B]">Empleados activos</h2>
            <p className="text-sm text-slate-500">
              Reglas: hasta 7:30 puntual, 7:31 a 7:40 = 1 hora faltada, 7:41 a 7:50 = 2 horas faltadas, después de 7:50 = 8 horas faltadas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0B4E87] text-white">
                  <th className="px-4 py-4 text-left text-sm uppercase tracking-wide">ID</th>
                  <th className="px-4 py-4 text-left text-sm uppercase tracking-wide">Empleado</th>
                  <th className="px-4 py-4 text-left text-sm uppercase tracking-wide">Hora entrada</th>
                  <th className="px-4 py-4 text-center text-sm uppercase tracking-wide">Resultado</th>
                  <th className="px-4 py-4 text-left text-sm uppercase tracking-wide">Observación</th>
                </tr>
              </thead>
              <tbody>
                {loadingDay ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Cargando empleados...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No hay empleados activos asignados a esta sucursal.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => {
                    const preview = calculatePreview(hoursByUser[employee.id_usuario] || "");
                    return (
                      <tr key={employee.id_usuario} className="border-b border-[#E5EDF6] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{employee.id_usuario}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="font-semibold text-[#1e2939]">{employee.nombre}</div>
                          <div className="text-xs text-slate-500">{employee.usuario}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="time"
                            value={hoursByUser[employee.id_usuario] || ""}
                            onChange={(event) =>
                              setHoursByUser((prev) => ({
                                ...prev,
                                [employee.id_usuario]: event.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Tag color={getPenaltyColor(preview.categoria)}>
                            {getPenaltyLabel(preview.categoria, preview.horas)}
                          </Tag>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={observationsByUser[employee.id_usuario] || ""}
                            placeholder="Opcional"
                            onChange={(event) =>
                              setObservationsByUser((prev) => ({
                                ...prev,
                                [employee.id_usuario]: event.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
