import type { ReactNode } from "react";

export interface DataTablePagination {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface DataTableColumn<T> {
  title: string;
  dataIndex?: keyof T | string;
  key: string;
  width?: number;
  className?: string;
  ellipsis?: boolean;
  render?: (value: unknown, record: T) => ReactNode;
}

export interface DataTableProps<T> {
  rowKey: keyof T | string | ((record: T) => string);
  columns: DataTableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: DataTablePagination;
  showSummary?: boolean;
  className?: string;
  emptyMessage?: string;
}

function getRowKey<T>(record: T, rowKey: DataTableProps<T>["rowKey"]): string {
  if (typeof rowKey === "function") return rowKey(record);
  return String((record as Record<string, unknown>)[rowKey as string]);
}

export function DataTable<T extends object>({
  rowKey,
  columns,
  dataSource,
  loading,
  pagination,
  showSummary = true,
  className = "",
  emptyMessage = "No hay datos",
}: DataTableProps<T>) {
  const total = pagination?.total ?? dataSource.length;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;
  const current = pagination?.current ?? 1;
  const start = pagination ? (current - 1) * pagination.pageSize + 1 : 1;
  const end = pagination
    ? Math.min(current * pagination.pageSize, pagination.total)
    : dataSource.length;

  const showSummaryRow =
    showSummary && (pagination != null || dataSource.length > 0);

  return (
    <div className={className}>
      {showSummaryRow && (
        <div className="py-2 text-sm text-[#4a5565]">
          Mostrando{" "}
          <span className="font-semibold text-[#1e2939]">
            {start}-{end}
          </span>{" "}
          de <span className="font-semibold text-[#1e2939]">{total}</span>{" "}
          resultados
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-[#d1d5dc] bg-white shadow-sm">
        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <span className="text-sm text-[#4a5565]">Cargando...</span>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0B4E87]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={
                      col.className ||
                      "px-4 py-4 text-center text-sm uppercase tracking-wide text-white"
                    }
                    style={{ width: col.width }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataSource.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-[#6b7280]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                dataSource.map((record) => (
                  <tr
                    key={getRowKey(record, rowKey)}
                    className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]"
                  >
                    {columns.map((col) => {
                      const value =
                        col.dataIndex != null
                          ? (record as Record<string, unknown>)[
                              col.dataIndex as string
                            ]
                          : undefined;
                      const content = col.render
                        ? col.render(value, record)
                        : (value as ReactNode);
                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-center text-sm text-[#1e2939] ${col.ellipsis ? "max-w-0 truncate" : ""} ${col.className || ""}`}
                          style={{ width: col.width }}
                        >
                          {col.ellipsis ? (
                            <span className="block truncate">{content}</span>
                          ) : (
                            <div className="flex justify-center items-center">
                              {content}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && totalPages > 1 && (
          <div className="flex h-[50px] items-center justify-between border-t border-[rgba(139,90,43,0.04)] bg-[rgba(139,90,43,0.03)] px-4">
            <button
              type="button"
              disabled={current <= 1}
              onClick={() =>
                pagination.onChange(current - 1, pagination.pageSize)
              }
              className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] disabled:opacity-40"
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pagination.onChange(p, pagination.pageSize)}
                  className={`h-10 w-10 rounded-lg text-sm font-medium ${
                    p === current
                      ? "bg-[#0B4E86] text-white"
                      : "border border-[#d1d5dc] bg-white text-[#364153]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() =>
                pagination.onChange(current + 1, pagination.pageSize)
              }
              className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-sm font-medium text-[#364153] disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
