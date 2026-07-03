import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getGlobalOperationalAlerts } from "@/components/layout/operational-alerts";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusPill } from "@/components/ui/status-pill";
import { demoAppointments, demoAutomationRules, demoBudgets, demoClinicSettings, demoExpenses, demoInventoryItems, demoPatients, demoPayments, demoTreatments } from "@/lib/demo-data";
import { AlertTriangle, CalendarCheck, CreditCard, FileText, PlusCircle, UserPlus, Activity, MessageSquareText, Package, BrainCircuit } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { buildAiInsights } from "@/lib/ai-insights";

const appointmentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  scheduled: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En curso"
};

function isSameDay(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth() && date.getDate() === reference.getDate();
}

export default async function DemoDashboardPage() {
  const settings = demoClinicSettings;
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const upcomingStatuses = ["pending", "scheduled", "confirmed", "in_progress"];
  const closedStatuses = ["finished", "completed", "cancelled", "canceled", "no_show"];
  const activeFutureAppointments = demoAppointments
    .filter((appointment) => upcomingStatuses.includes(appointment.status))
    .filter((appointment) => !closedStatuses.includes(appointment.status))
    .filter((appointment) => new Date(appointment.starts_at).getTime() >= todayStart.getTime())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const todayAppointments = activeFutureAppointments.filter((appointment) => isSameDay(new Date(appointment.starts_at), today));
  const pendingTodayAppointments = todayAppointments.filter((appointment) => ["pending", "scheduled"].includes(appointment.status));
  const activeTreatments = demoTreatments.filter((treatment) => ["approved", "in_progress", "budgeted"].includes(treatment.status));
  const pendingBudgets = demoBudgets.filter((budget) => ["draft", "sent"].includes(budget.status));
  const activePayments = demoPayments.filter((payment) => payment.status !== "voided");
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const paidThisMonth = activePayments
    .filter((payment) => { const date = new Date(payment.paid_at); return date.getMonth() === currentMonth && date.getFullYear() === currentYear; })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const expensesThisMonth = demoExpenses
    .filter((expense) => (expense.status || "active") === "active")
    .filter((expense) => { const date = new Date(expense.expense_date); return date.getMonth() === currentMonth && date.getFullYear() === currentYear; })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const resultThisMonth = paidThisMonth - expensesThisMonth;
  const approvedBudgets = demoBudgets.filter((budget) => budget.status === "approved");
  const approvedTotal = approvedBudgets.reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);
  const totalPaidOnApproved = approvedBudgets.reduce((sum, budget) => sum + Number(budget.paid_amount || 0), 0);
  const pendingBalance = Math.max(0, approvedTotal - totalPaidOnApproved);
  const activeAutomationRules = demoAutomationRules.filter((rule) => rule.is_enabled);
  const lowStockItems = demoInventoryItems.filter((item) => item.is_active !== false && Number(item.current_stock || 0) <= Number(item.minimum_stock || 0));
  const aiInsights = buildAiInsights({ patients: demoPatients, appointments: demoAppointments, treatments: demoTreatments, budgets: demoBudgets, payments: demoPayments, inventoryItems: demoInventoryItems });
  const highAiInsights = aiInsights.filter((insight) => insight.priority === "alta");
  const upcomingAppointments = activeFutureAppointments.slice(0, 8);
  const patientIdsWithFutureAppointment = new Set(activeFutureAppointments.map((appointment) => appointment.patient_id).filter(Boolean));
  const scheduledPatientsWithoutFutureAppointment = demoPatients.filter((patient) => patient.status === "scheduled" && !patientIdsWithFutureAppointment.has(patient.id));
  const operationalAlerts = await getGlobalOperationalAlerts("demo");
  const requireAttentionCount = operationalAlerts.length;

  return (
    <AppShell mode="demo" operationalAlerts={operationalAlerts}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Dashboard operativo</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista de demostración alineada con el sistema real. Los datos son ficticios y no se guardan cambios.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/demo/appointments" className="rounded-3xl bg-primary px-5 py-4 text-center font-semibold text-white shadow-soft transition hover:bg-blue-700">
          <span className="inline-flex items-center justify-center gap-2"><PlusCircle size={18} /> Nueva cita</span>
        </Link>
        <Link href="/demo/patients" className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-ink shadow-soft transition hover:border-primary/30 hover:text-primary">
          <span className="inline-flex items-center justify-center gap-2"><UserPlus size={18} /> Nuevo paciente</span>
        </Link>
        <Link href="/demo/treatments" className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-ink shadow-soft transition hover:border-primary/30 hover:text-primary">
          <span className="inline-flex items-center justify-center gap-2"><Activity size={18} /> Nuevo tratamiento</span>
        </Link>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Citas de hoy" value={String(todayAppointments.length)} note="Pendientes, programadas o confirmadas" icon={<CalendarCheck size={22} />} />
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Requieren atención</p>
              <p className="mt-2 text-2xl font-bold text-amber-950">{requireAttentionCount}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700"><AlertTriangle size={22} /></div>
          </div>
          <p className="mt-4 text-xs text-amber-800">Confirmaciones, pacientes sin cita, presupuestos pendientes o stock bajo.</p>
        </div>
        <MetricCard title="Tratamientos activos" value={String(activeTreatments.length)} note="Planes en seguimiento" icon={<FileText size={22} />} />
        <MetricCard title="Presupuestos pendientes" value={String(pendingBudgets.length)} note="Por aprobar o recuperar" icon={<FileText size={22} />} />
        <MetricCard title="Ingresos del mes" value={formatMoney(paidThisMonth, settings)} note="Pagos demo registrados" icon={<CreditCard size={22} />} />
        <MetricCard title="Egresos del mes" value={formatMoney(expensesThisMonth, settings)} note="Gastos demo" icon={<CreditCard size={22} />} />
        <MetricCard title="Resultado del mes" value={formatMoney(resultThisMonth, settings)} note="Ingresos menos egresos" icon={<CreditCard size={22} />} />
        <MetricCard title="Saldo pendiente" value={formatMoney(pendingBalance, settings)} note="Presupuestos aprobados" icon={<CreditCard size={22} />} />
        <MetricCard title="Automatizaciones activas" value={String(activeAutomationRules.length)} note="Recordatorios y seguimientos" icon={<MessageSquareText size={22} />} />
        <MetricCard title="Insumos críticos" value={String(lowStockItems.length)} note="Stock bajo o igual al mínimo" icon={<Package size={22} />} />
        <MetricCard title="Insights IA" value={String(aiInsights.length)} note={`${highAiInsights.length} de prioridad alta`} icon={<BrainCircuit size={22} />} />
      </section>

      {scheduledPatientsWithoutFutureAppointment.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-bold text-amber-950">Pacientes agendados sin cita futura</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Hay {scheduledPatientsWithoutFutureAppointment.length} paciente(s) en estado CRM Agendado, pero sin una próxima cita activa registrada.
                </p>
              </div>
            </div>
            <Link href="/demo/patients" className="btn-secondary whitespace-nowrap border-amber-200 bg-white text-amber-800 hover:bg-amber-100">
              Revisar pacientes
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-6 card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Próximas citas activas</h2>
            <p className="mt-1 text-sm text-muted">Solo se muestran citas futuras activas. No incluye finalizadas, canceladas o no asistidas.</p>
          </div>
          <StatusPill label="Demo agenda" variant="success" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr><th className="py-3">Hora</th><th>Paciente</th><th>Servicio</th><th>Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingAppointments.length ? upcomingAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="py-3 font-semibold text-ink">
                    {new Date(appointment.starts_at).toLocaleDateString(settings.locale, { day: "2-digit", month: "short" })} · {new Date(appointment.starts_at).toLocaleTimeString(settings.locale, { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="text-muted">{appointment.patients?.full_name || "Paciente sin asignar"}</td>
                  <td className="text-muted">{appointment.services?.name || "Servicio sin asignar"}</td>
                  <td><StatusPill label={appointmentStatusLabels[appointment.status] || appointment.status} variant={appointment.status === "confirmed" || appointment.status === "in_progress" ? "success" : "warning"} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">No hay próximas citas activas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
