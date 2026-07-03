"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CreditCard, Lightbulb, Package, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusPill } from "@/components/ui/status-pill";

type InsightPriority = "alta" | "media" | "baja";
type InsightKind = "riesgo" | "cobranza" | "agenda" | "inventario" | "recuperacion" | "seguimiento";

type Insight = {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  href: string;
  priority: InsightPriority;
  kind: InsightKind;
};

const priorityVariant = {
  alta: "danger",
  media: "warning",
  baja: "success",
} as const;

const kindLabels = {
  riesgo: "Riesgo",
  cobranza: "Cobranza",
  agenda: "Agenda",
  inventario: "Inventario",
  recuperacion: "Recuperación",
  seguimiento: "Seguimiento",
};

const kindIcons = {
  riesgo: AlertTriangle,
  cobranza: CreditCard,
  agenda: CalendarDays,
  inventario: Package,
  recuperacion: UserRound,
  seguimiento: Lightbulb,
};

export function PriorityInsightsList({ insights }: { insights: Insight[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedInsights = useMemo(() => {
    const start = (page - 1) * pageSize;
    return insights.slice(start, start + pageSize);
  }, [insights, page, pageSize]);

  if (!insights.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted">
        No hay alertas inteligentes por ahora. El sistema seguirá evaluando pacientes, agenda, pagos e inventario.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {paginatedInsights.map((insight) => {
          const Icon = kindIcons[insight.kind];
          return (
            <Link
              key={insight.id}
              href={insight.href}
              className="block rounded-3xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                    <Icon size={19} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-ink">{insight.title}</p>
                      <StatusPill label={kindLabels[insight.kind]} variant="neutral" />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">{insight.description}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Sugerencia: {insight.recommendation}</p>
                  </div>
                </div>
                <StatusPill label={`Prioridad ${insight.priority}`} variant={priorityVariant[insight.priority]} />
              </div>
            </Link>
          );
        })}
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalItems={insights.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        className="mt-4"
      />
    </>
  );
}
