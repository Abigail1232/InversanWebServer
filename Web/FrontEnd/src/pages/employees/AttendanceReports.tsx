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
import WeeklyAttendanceReport from "../../components/WeeklyAttendanceReport";

const today = dayjs().format("YYYY-MM-DD");
const firstDayOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
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

  const canEdit = Boolean(context?.canEditarAsistencia);

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
      title: "7:31 a 7:39",
      key: "rango_7_31_7_39",
      dataIndex: "rango_7_31_7_39",
      width: 140,
      render: (value) => <Tag color="gold">{Number(value || 0)}</Tag>,
    },
    {
      title: "7:40 a 7:49",
      key: "rango_7_40_7_49",
      dataIndex: "rango_7_40_7_49",
      width: 140,
      render: (value) => <Tag color="orange">{Number(value || 0)}</Tag>,
    },
    {
      title: "7:50 en adelante",
      key: "desde_7_50",
      dataIndex: "desde_7_50",
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
        width="min(1100px, calc(100vw - 24px))"
      >
        {recordsLoading ? (
          <div className="py-10 text-center text-slate-500">Cargando registros...</div>
        ) : (
          <WeeklyAttendanceReport
            records={records}
            startDate={fechaInicio}
            endDate={fechaFin}
            canEdit={canEdit}
            onEdit={handleOpenEdit}
          />
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
