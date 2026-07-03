"use client";

import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className
}: PaginationControlsProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const end = Math.min(totalItems, currentPage * safePageSize);

  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="font-semibold">
        Mostrando <span className="font-black text-ink">{start}-{end}</span> de <span className="font-black text-ink">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <select
            value={safePageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-muted outline-none focus:border-primary"
            aria-label="Registros por página"
          >
            {pageSizeOptions.map((option) => <option key={option} value={option}>{option} por página</option>)}
          </select>
        ) : null}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-ink">{currentPage}/{totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
