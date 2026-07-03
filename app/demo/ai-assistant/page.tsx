import Link from "next/link";
import { AlertTriangle, Bot, BrainCircuit, CalendarDays, CreditCard, Lightbulb, Package, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { PriorityInsightsList } from "@/components/ai/priority-insights-list";
import { MetricCard } from "@/components/ui/metric-card";
import { buildAiInsights, buildPatientAiSummary } from "@/lib/ai-insights";
import { demoAppointments, demoBudgets, demoClinicSettings, demoInventoryItems, demoPatients, demoPayments, demoTreatments } from "@/lib/demo-data";
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

export default function DemoAiAssistantPage() {
  const settings = demoClinicSettings;
  const insights = buildAiInsights({ patients: demoPatients, appointments: demoAppointments, treatments: demoTreatments, budgets: demoBudgets, payments: demoPayments, inventoryItems: demoInventoryItems });
  const demoInsights = insights.map((insight) => ({ ...insight, href: insight.href.replace(/^\//, "/demo/") }));
  const highPriority = insights.filter((insight) => insight.priority === "alta");
  const collectionInsights = insights.filter((insight) => insight.kind === "cobranza");
  const inventoryInsights = insights.filter((insight) => insight.kind === "inventario");
  const patientsWithContext = demoPatients
    .map((patient) => ({ patient, ai: buildPatientAiSummary({ patient, appointments: demoAppointments, treatments: demoTreatments, budgets: demoBudgets, payments: demoPayments }) }))
    .slice(0, 6);

  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Asistente IA</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista demo del copiloto operativo. Genera recomendaciones usando reglas inteligentes sobre datos simulados.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Insights activos" value={String(insights.length)} note="Acciones sugeridas" icon={<BrainCircuit size={22} />} />
        <MetricCard title="Prioridad alta" value={String(highPriority.length)} note="Requieren atención" icon={<AlertTriangle size={22} />} />
        <MetricCard title="Cobranza sugerida" value={String(collectionInsights.length)} note="Saldos pendientes" icon={<CreditCard size={22} />} />
        <MetricCard title="Inventario crítico" value={String(inventoryInsights.length)} note="Insumos bajo mínimo" icon={<Package size={22} />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5">
          <h2 className="text-lg font-bold text-ink">Prioridades recomendadas</h2>
          <p className="mt-1 text-sm text-muted">Acciones ordenadas por impacto operativo y comercial.</p>
          <div className="mt-4">
            <PriorityInsightsList insights={demoInsights} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold text-ink">Resumen ejecutivo IA</h2>
          <p className="mt-1 text-sm text-muted">Lectura rápida demo.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-bold text-ink">Atención prioritaria</p><p className="mt-2 text-sm leading-6 text-muted">Hay {highPriority.length} situación(es) de prioridad alta.</p></div>
            <div className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-bold text-ink">Cobranza</p><p className="mt-2 text-sm leading-6 text-muted">{collectionInsights.length} presupuesto(s) aprobado(s) requieren seguimiento de pago.</p></div>
            <div className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-bold text-ink">Inventario</p><p className="mt-2 text-sm leading-6 text-muted">{inventoryInsights.length} insumo(s) están por debajo del mínimo.</p></div>
          </div>
        </div>
      </section>

      <section className="mt-6 card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Pacientes con contexto inteligente</h2>
            <p className="mt-1 text-sm text-muted">Resumen demo generado con citas, tratamientos, presupuestos y pagos.</p>
          </div>
          <Bot className="text-primary" size={22} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {patientsWithContext.map(({ patient, ai }) => (
            <article key={patient.id} className="rounded-3xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-bold text-ink">{patient.full_name}</p><p className="mt-1 text-sm text-muted">{patient.phone}</p></div>
                <StatusPill label={`Riesgo ${ai.riskLevel}`} variant={priorityVariant[ai.riskLevel]} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{ai.summary}</p>
              <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-900"><span className="font-bold">Recomendación:</span> {ai.recommendation}</div>
              {ai.balance > 0 ? <p className="mt-3 text-sm font-semibold text-amber-700">Saldo pendiente: {formatMoney(ai.balance, settings)}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
