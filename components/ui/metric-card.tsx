import { ReactNode } from "react";

export function MetricCard({ title, value, note, icon }: { title: string; value: string; note: string; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        </div>
        {icon ? <div className="rounded-xl bg-blue-50 p-3 text-primary">{icon}</div> : null}
      </div>
      <p className="mt-4 text-xs text-slate-500">{note}</p>
    </div>
  );
}
