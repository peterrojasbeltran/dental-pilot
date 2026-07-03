import { cn } from "@/lib/utils";

type OperationalKpiProps = {
  label: string;
  value: string | number;
  help?: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
};

const toneClass = {
  default: "border-slate-100 bg-white text-ink",
  success: "border-emerald-100 bg-emerald-50 text-emerald-950",
  warning: "border-amber-100 bg-amber-50 text-amber-950",
  danger: "border-red-100 bg-red-50 text-red-950",
  primary: "border-blue-100 bg-blue-50 text-blue-950"
};

export function OperationalKpi({ label, value, help, tone = "default" }: OperationalKpiProps) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", toneClass[tone])}>
      <p className="text-xs font-black uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {help ? <p className="mt-1 text-xs font-semibold opacity-70">{help}</p> : null}
    </div>
  );
}
