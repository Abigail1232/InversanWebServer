import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Tag, message } from "antd";
import dayjs from "dayjs";
import {
  getAttendanceContext,
  getAttendanceReports,
  getUserAttendanceRecords,
  updateAttendanceRecord,
  type AttendanceContext,
  type AttendanceRecord,
  type AttendanceReportRow,
} from "../../api/attendance/attendance";
import { DataTable, type DataTableColumn } from "../../components/DataTable";

const today = dayjs().format("YYYY-MM-DD");
const firstDayOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getPenaltyLabel(categoria: string, horas: number) {
  if (categoria === "puntual") return "Puntual";
  if (categoria === "penalizacion_1h") return "1 hora faltada";
  if (categoria === "penalizacion_2h") return "2 horas faltadas";
  if (categoria === "falta_jornada") return "8 horas faltadas";
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

function startOfWeekMonday(fecha: string) {
  const date = dayjs(fecha);
  const diff = (date.day() + 6) % 7;
  return date.subtract(diff, "day").format("YYYY-MM-DD");
}

type WeekGroup = {
  weekStart: string;
  days: Array<{
    label: string;
    date: string;
    record?: AttendanceRecord;
  }>;
};

function buildWeekGroups(records: AttendanceRecord[]): WeekGroup[] {
  const byDate = new Map(records.map((record) => [record.fecha, record]));
  const starts = Array.from(new Set(records.map((record) => startOfWeekMonday(record.fecha)))).sort();

  return starts.map((weekStart) => ({
    weekStart,
    days: weekDays.map((label, index) => {
      const date = dayjs(weekStart).add(index, "day").format("YYYY-MM-DD");
      return { label, date, record: byDate.get(date) };
    }),
  }));
}

export default function AttendanceReports() {
  const [msg, contextHolder] = message.useMessage();
  const [context, setContext] = useState<AttendanceContext | null>(null);
  const [branchId, setBranchId] = useState<number | undefined>();
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
  const [fechaFin, setFechaFin] = useState(today);
  const [reports, setReports] = useState<AttendanceReportRow[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AttendanceReportRow | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editHour, setEditHour] = useState("");
  const [editObservation, setEditObservation] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const branchOptions = useMemo(
    () =>
      (context?.sucursales || []).map((branch) => ({
        value: branch.id_sucursal,
        label: branch.nombre,
      })),
    [context],
  );

  const weekGroups = useMemo(() => buildWeekGroups(records), [records]);

  const loadReports = async (selectedBranchId = branchId) => {
    if (!selectedBranchId) return;

    setLoadingReports(true);
    try {
      const data = await getAttendanceReports({
        id_sucursal: selectedBranchId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setReports(data);
    } catch {
      msg.error("No se pudieron cargar los reportes de asistencia");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadRecords = async (row: AttendanceReportRow) => {
    if (!branchId) return;

    setSelectedRow(row);
    setRecordsLoading(true);
    try {
      const data = await getUserAttendanceRecords({
        id_usuario: row.id_usuario,
        id_sucursal: branchId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setRecords(data);
    } catch {
      msg.error("No se pudieron cargar los registros del empleado");
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingContext(true);

    void getAttendanceContext()
      .then((data) => {
        if (cancelled) return;
        setContext(data);
        setBranchId(data.defaultBranchId ?? undefined);
        if (data.defaultBranchId) {
          void loadReports(data.defaultBranchId);
        }
      })
      .catch(() => {
        if (!cancelled) msg.error("No se pudo cargar el contexto de reportes");
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [msg]);

  useEffect(() => {
    if (branchId) {
      void loadReports(branchId);
    }
  }, [branchId, fechaInicio, fechaFin]);

  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditRecord(record);
    setEditHour(record.hora_entrada);
    setEditObservation(record.observacion || "");
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    if (!editHour) {
      msg.warning("Ingrese una hora válida");
      return;
    }

    setSavingEdit(true);
    try {
      await updateAttendanceRecord({
        id_asistencia: editRecord.id_asistencia,
        hora_entrada: editHour,
        observacion: editObservation || null,
      });
      msg.success("Registro actualizado correctamente");
      setEditRecord(null);

      if (selectedRow) {
        await loadRecords(selectedRow);
      }
      await loadReports();
    } catch {
      msg.error("No se pudo actualizar el registro");
    } finally {
      setSavingEdit(false);
    }
  };

  const columns: DataTableColumn<AttendanceReportRow>[] = [
    {
      title: "ID User",
      key: "id_usuario",
      dataIndex: "id_usuario",
      width: 100,
    },
    {
      title: "Nombre",
      key: "nombre",
      dataIndex: "nombre",
      render: (_value, row) => (
        <div className="text-left">
          <div className="font-semibold text-[#1e2939]">{row.nombre}</div>
          <div className="text-xs text-slate-500">{row.usuario}</div>
        </div>
      ),
    },
    {
      title: "7:31 a 7:40",
      key: "rango_7_31_7_40",
      dataIndex: "rango_7_31_7_40",
      width: 140,
      render: (value) => <Tag color="gold">{Number(value || 0)}</Tag>,
    },
    {
      title: "7:41 a 7:50",
      key: "rango_7_41_7_50",
      dataIndex: "rango_7_41_7_50",
      width: 140,
      render: (value) => <Tag color="orange">{Number(value || 0)}</Tag>,
    },
    {
      title: "Después de 7:50",
      key: "despues_7_50",
      dataIndex: "despues_7_50",
      width: 160,
      render: (value) => <Tag color="red">{Number(value || 0)}</Tag>,
    },
    {
      title: "Horas faltadas",
      key: "horas_faltadas",
      dataIndex: "horas_faltadas",
      width: 140,
      render: (value) => <span className="font-bold text-[#D61216]">{Number(value || 0)}</span>,
    },
    {
      title: "Ver registro",
      key: "actions",
      width: 150,
      render: (_value, row) => (
        <Button type="primary" className="bg-[#027EB1]" onClick={() => void loadRecords(row)}>
          Ver registro
        </Button>
      ),
    },
  ];

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
              <h1 className="mt-1 text-2xl font-bold text-[#003E7B]">Reportes de asistencias</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Consulte penalizaciones por rango de llegada, total de horas faltadas y registros semanales por empleado.
              </p>
            </div>
            <Button type="primary" size="large" loading={loadingReports} onClick={() => void loadReports()} className="bg-[#027EB1]">
              Actualizar reporte
            </Button>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-[#D7E3F0] bg-white p-5 shadow-sm md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Sucursal</label>
            <Select
              className="w-full"
              size="large"
              loading={loadingContext}
              value={branchId}
              options={branchOptions}
              placeholder="Seleccione una sucursal"
              onChange={(value: number) => setBranchId(value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha inicio</label>
            <Input size="large" type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value || firstDayOfMonth)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha fin</label>
            <Input size="large" type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value || today)} />
          </div>
        </div>

        <DataTable
          rowKey="id_usuario"
          columns={columns}
          dataSource={reports}
          loading={loadingReports}
          emptyMessage="No hay registros de asistencia en el rango seleccionado"
        />
      </div>

      <Modal
        title={selectedRow ? `Registro semanal: ${selectedRow.nombre}` : "Registro semanal"}
        open={Boolean(selectedRow)}
        onCancel={() => {
          setSelectedRow(null);
          setRecords([]);
        }}
        footer={null}
        width={1100}
      >
        {recordsLoading ? (
          <div className="py-10 text-center text-slate-500">Cargando registros...</div>
        ) : weekGroups.length === 0 ? (
          <div className="py-10 text-center text-slate-500">Este empleado no tiene registros en el rango seleccionado.</div>
        ) : (
          <div className="space-y-6">
            {weekGroups.map((week) => (
              <div key={week.weekStart} className="overflow-hidden rounded-2xl border border-[#D7E3F0]">
                <div className="bg-[#EAF7FD] px-4 py-3 font-semibold text-[#003E7B]">
                  Semana del {dayjs(week.weekStart).format("DD/MM/YYYY")}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="bg-[#0B4E87] text-white">
                        {week.days.map((day) => (
                          <th key={day.date} className="px-3 py-3 text-center text-xs uppercase tracking-wide">
                            <div>{day.label}</div>
                            <div className="font-normal opacity-90">{dayjs(day.date).format("DD/MM")}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {week.days.map((day) => (
                          <td key={day.date} className="border border-[#E5EDF6] bg-white px-3 py-4 text-center align-top">
                            {day.record ? (
                              <div className="space-y-2">
                                <Tag color={getPenaltyColor(day.record.categoria)}>
                                  {getPenaltyLabel(day.record.categoria, day.record.horas_faltadas)}
                                </Tag>
                                <div className="text-lg font-bold text-[#003E7B]">{day.record.hora_entrada}</div>
                                <div className="text-xs text-slate-500">Horas faltadas: {day.record.horas_faltadas}</div>
                                <Button size="small" onClick={() => handleOpenEdit(day.record as AttendanceRecord)}>
                                  Editar
                                </Button>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-xs text-slate-400">
                                Sin registro
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="Editar asistencia"
        open={Boolean(editRecord)}
        onCancel={() => setEditRecord(null)}
        okText="Guardar cambio"
        cancelText="Cancelar"
        confirmLoading={savingEdit}
        onOk={() => void handleSaveEdit()}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha</label>
            <Input value={editRecord?.fecha || ""} disabled />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Hora entrada</label>
            <Input type="time" value={editHour} onChange={(event) => setEditHour(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Observación</label>
            <Input.TextArea rows={3} value={editObservation} onChange={(event) => setEditObservation(event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
