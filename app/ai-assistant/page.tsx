export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, Bot, BrainCircuit, CalendarDays, CreditCard, Lightbulb, Package, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { PriorityInsightsList } from "@/components/ai/priority-insights-list";
import { MetricCard } from "@/components/ui/metric-card";
import { buildAiInsights, buildPatientAiSummary } from "@/lib/ai-insights";
import { getAppointments, getBudgets, getClinicSettings, getInventoryItems, getPatients, getPayments, getTreatments } from "@/lib/data";
import { formatMoney } from "@/lib/currency";

const priorityVariant = {
  alta: "danger",
  media: "warning",
  baja: "success"
} as const;

const kindLabels = {
  riesgo: "Riesgo",
  cobranza: "Cobranza",
  agenda: "Agenda",
  inventario: "Inventario",
  recuperacion: "Recuperación",
  seguimiento: "Seguimiento"
};

const kindIcons = {
  riesgo: AlertTriangle,
  cobranza: CreditCard,
  agenda: CalendarDays,
  inventario: Package,
  recuperacion: UserRound,
  seguimiento: Lightbulb
};

export default async function Page() {
  const [settings, patients, appointments, treatments, budgets, payments, inventoryItems] = await Promise.all([
    getClinicSettings(),
    getPatients(),
    getAppointments(),
    getTreatments(),
    getBudgets(),
    getPayments(),
    getInventoryItems()
  ]);

  const insights = buildAiInsights({ patients, appointments, treatments, budgets, payments, inventoryItems });
  const highPriority = insights.filter((insight) => insight.priority === "alta");
  const collectionInsights = insights.filter((insight) => insight.kind === "cobranza");
  const followUpInsights = insights.filter((insight) => ["riesgo", "recuperacion", "seguimiento", "agenda"].includes(insight.kind));
  const inventoryInsights = insights.filter((insight) => insight.kind === "inventario");

  const patientsWithContext = patients
    .map((patient) => ({ patient, ai: buildPatientAiSummary({ patient, appointments, treatments, budgets, payments }) }))
    .sort((a, b) => {
      const weight = { alta: 3, media: 2, baja: 1 } as const;
      return weight[b.ai.riskLevel] - weight[a.ai.riskLevel] || b.ai.balance - a.ai.balance;
    })
    .slice(0, 6);

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <StatusPill label="AI Assistant · Reglas inteligentes" variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Asistente IA</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Insights generados con los datos de Dental Pilot. Esta versión no usa API externa: prioriza riesgos, cobranza, agenda e inventario con reglas claras y auditables.
          </p>
        </div>
        <Link href="/patients" className="btn-secondary">Ver pacientes</Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Insights activos" value={String(insights.length)} note="Acciones sugeridas por el sistema" icon={<BrainCircuit size={22} />} />
        <MetricCard title="Prioridad alta" value={String(highPriority.length)} note="Requieren atención primero" icon={<AlertTriangle size={22} />} />
        <MetricCard title="Cobranza sugerida" value={String(collectionInsights.length)} note="Presupuestos con saldo pendiente" icon={<CreditCard size={22} />} />
        <MetricCard title="Inventario crítico" value={String(inventoryInsights.length)} note="Insumos bajo mínimo" icon={<Package size={22} />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Prioridades recomendadas</h2>
              <p className="mt-1 text-sm text-muted">Acciones ordenadas por impacto operativo y comercial.</p>
            </div>
            <StatusPill label="Sin costo IA" variant="success" />
          </div>

          <div className="mt-4">
            <PriorityInsightsList insights={insights} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold text-ink">Resumen ejecutivo IA</h2>
          <p className="mt-1 text-sm text-muted">Lectura rápida para priorizar el día.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-ink">Atención prioritaria</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {highPriority.length ? `Hay ${highPriority.length} situación(es) de prioridad alta. Conviene resolverlas antes de continuar con tareas administrativas.` : "No hay situaciones críticas detectadas."}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-ink">Cobranza</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {collectionInsights.length ? `Existen ${collectionInsights.length} presupuesto(s) aprobado(s) con saldo pendiente.` : "No se detecta cobranza pendiente crítica."}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-ink">Seguimiento clínico</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {followUpInsights.length ? `${followUpInsights.length} paciente(s) podrían necesitar seguimiento o próxima cita.` : "Los pacientes activos tienen seguimiento suficiente por ahora."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Pacientes con contexto inteligente</h2>
            <p className="mt-1 text-sm text-muted">Resumen generado con citas, tratamientos, presupuestos y pagos.</p>
          </div>
          <Bot className="text-primary" size={22} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {patientsWithContext.map(({ patient, ai }) => (
            <article key={patient.id} className="rounded-3xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{patient.full_name}</p>
                  <p className="mt-1 text-sm text-muted">{patient.phone} · {patient.email || "Sin correo"}</p>
                </div>
                <StatusPill label={`Riesgo ${ai.riskLevel}`} variant={priorityVariant[ai.riskLevel]} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{ai.summary}</p>
              <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">
                <span className="font-bold">Recomendación:</span> {ai.recommendation}
              </div>
              {ai.balance > 0 ? <p className="mt-3 text-sm font-semibold text-amber-700">Saldo pendiente: {formatMoney(ai.balance, settings)}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
