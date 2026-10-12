import { useEffect, useState } from "react";
import { Alert, Button, Spin, message } from "antd";
import dayjs from "dayjs";
import {
  getMyAttendanceRecords,
  getMyAttendanceSummary,
  type AttendanceRecord,
  type MyAttendanceSummary,
} from "../../api/attendance/attendance";
import WeeklyAttendanceReport from "../../components/WeeklyAttendanceReport";

export default function MyAttendance() {
  const [msg, contextHolder] = message.useMessage();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<MyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getMyAttendanceSummary({ mes: dayjs().month() + 1, anio: dayjs().year() }),
      getMyAttendanceRecords({ fecha_inicio: startDate, fecha_fin: endDate }),
    ])
      .then(([monthSummary, attendanceRecords]) => {
        if (cancelled) return;
        setSummary(monthSummary);
        setRecords(attendanceRecords);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudo cargar tu asistencia. Verifica que tu usuario esté asignado a una sucursal.");
        msg.error("No se pudo cargar tu asistencia");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endDate, msg, startDate]);

  return (
    <div className="min-h-screen bg-[#F3F6FA] px-4 py-8">
      {contextHolder}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[#D7E3F0] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#027EB1]">Asistencia</p>
              <h1 className="mt-1 text-2xl font-bold text-[#003E7B]">Mi asistencia</h1>
              <p className="mt-2 text-sm text-slate-500">
                {new Intl.DateTimeFormat("es-HN", { month: "long", year: "numeric" }).format(new Date())}
              </p>
            </div>
            <div className="min-w-52 rounded-2xl border border-[#D7E3F0] bg-[#F8FAFC] px-5 py-4 text-center">
              <div className="text-sm font-semibold text-slate-600">Horas faltadas este mes</div>
              <div className="mt-1 text-2xl font-bold text-[#003E7B]">
                {summary?.horas_faltadas ?? 0} {summary?.horas_faltadas === 1 ? "hora" : "horas"}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            action={<Button size="small" onClick={() => window.location.reload()}>Reintentar</Button>}
          />
        )}

        {loading ? (
          <div className="rounded-3xl border border-[#D7E3F0] bg-white py-12 text-center shadow-sm">
            <Spin />
          </div>
        ) : (
          <WeeklyAttendanceReport
            records={records}
            startDate={startDate}
            endDate={endDate}
            canEdit={false}
          />
        )}
      </div>
    </div>
  );
}