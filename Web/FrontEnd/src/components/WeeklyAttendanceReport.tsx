import { Button, Tag } from "antd";
import dayjs from "dayjs";
import type { AttendanceRecord } from "../api/attendance/attendance";

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

type Props = {
  records: AttendanceRecord[];
  startDate: string;
  endDate: string;
  canEdit?: boolean;
  onEdit?: (record: AttendanceRecord) => void;
};

export default function WeeklyAttendanceReport({
  records,
  startDate,
  endDate,
  canEdit = false,
  onEdit,
}: Props) {
  const byDate = new Map(records.map((record) => [record.fecha, record]));
  const firstDay = dayjs(startDate);
  const lastDay = dayjs(endDate);
  const firstMonday = firstDay.subtract((firstDay.day() + 6) % 7, "day");
  const weeks = [];

  for (let weekStart = firstMonday; !weekStart.isAfter(lastDay, "day"); weekStart = weekStart.add(7, "day")) {
    weeks.push({
      weekStart,
      days: weekDays.map((label, index) => {
        const date = weekStart.add(index, "day").format("YYYY-MM-DD");
        return { label, date, record: byDate.get(date) };
      }),
    });
  }

  return (
    <div className="space-y-6">
      {weeks.map((week) => (
        <div key={week.weekStart.format("YYYY-MM-DD")} className="overflow-hidden rounded-2xl border border-[#D7E3F0]">
          <div className="bg-[#EAF7FD] px-4 py-3 font-semibold text-[#003E7B]">
            Semana del {week.weekStart.format("DD/MM/YYYY")}
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
                      {dayjs(day.date).isBefore(firstDay, "day") || dayjs(day.date).isAfter(lastDay, "day") ? (
                        <div className="min-h-[56px]" />
                      ) : day.record ? (
                        <div className="space-y-2">
                          <Tag color={getPenaltyColor(day.record.categoria)}>
                            {getPenaltyLabel(day.record.categoria, day.record.horas_faltadas)}
                          </Tag>
                          <div className="text-lg font-bold text-[#003E7B]">{day.record.hora_entrada}</div>
                          <div className="text-xs text-slate-500">Horas faltadas: {day.record.horas_faltadas}</div>
                          {canEdit && onEdit && (
                            <Button size="small" onClick={() => onEdit(day.record!)}>
                              Editar
                            </Button>
                          )}
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
  );
}