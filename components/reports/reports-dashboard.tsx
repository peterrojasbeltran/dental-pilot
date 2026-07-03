"use client";

import { useMemo, useState } from "react";
import { Activity, CalendarCheck, Download, FileText, TrendingUp, Users, WalletCards } from "lucide-react";
import type { Appointment, Budget, ClinicSettings, Expense, Patient, Payment, Treatment } from "@/types/database";
import { formatMoney } from "@/lib/currency";
import { StatusPill } from "@/components/ui/status-pill";
import { PaginationControls } from "@/components/ui/pagination-controls";

type Props = {
  settings: ClinicSettings;
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  budgets: Budget[];
  payments: Payment[];
  expenses?: Expense[];
  mode?: "app" | "demo";
};

type ReportPeriod = "today" | "week" | "month" | "all";

const periodLabels: Record<ReportPeriod, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  all: "Todo"
};

const budgetStatusLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido"
};

function periodStart(period: ReportPeriod) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") return start;
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start;
  }
  if (period === "month") {
    start.setDate(1);
    return start;
  }
  return null;
}

function inPeriod(value: string | null | undefined, period: ReportPeriod) {
  if (period === "all") return true;
  if (!value) return false;
  const start = periodStart(period);
  if (!start) return true;
  return new Date(value).getTime() >= start.getTime();
}

function activePayment(payment: Payment) {
  return payment.status !== "voided";
}

function paidForBudget(budget: Budget, payments: Payment[]) {
  return payments
    .filter((payment) => payment.budget_id === budget.id && activePayment(payment))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function paymentState(total: number, paid: number) {
  if (paid <= 0) return "Pendiente";
  if (paid >= total) return "Pagado";
  return "Parcial";
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportCard({ title, value, description, icon, tone = "default" }: { title: string; value: string; description: string; icon: React.ReactNode; tone?: "default" | "warning" | "success" }) {
  const toneClass = tone === "warning" ? "bg-amber-50 text-amber-700" : tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-primary";
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          <p className="mt-2 text-2xl font-black text-ink">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneClass}`}>{icon}</div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

function CompactLine({ primary, secondary, amount, badge }: { primary: string; secondary: string; amount: string; badge?: React.ReactNode }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
      <div>
        <p className="font-bold text-ink">{primary}</p>
        <p className="mt-1 text-xs text-muted sm:hidden">{secondary}</p>
      </div>
      <p className="hidden text-muted sm:block">{secondary}</p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="font-black text-ink">{amount}</p>
        {badge}
      </div>
    </div>
  );
}

export function ReportsDashboard({ settings, patients, appointments, treatments, budgets, payments, expenses = [], mode = "app" }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [financePage, setFinancePage] = useState(1);
  const [financePageSize, setFinancePageSize] = useState(10);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const [budgetsPage, setBudgetsPage] = useState(1);
  const [budgetsPageSize, setBudgetsPageSize] = useState(10);

  const metrics = useMemo(() => {
    const periodPayments = payments.filter((payment) => activePayment(payment) && inPeriod(payment.paid_at, period));
    const periodAppointments = appointments.filter((appointment) => inPeriod(appointment.starts_at, period));
    const periodExpenses = expenses.filter((expense) => (expense.status || "active") === "active" && inPeriod(expense.expense_date, period));
    const periodPatients = patients.filter((patient) => inPeriod(patient.created_at, period));
    const periodBudgets = budgets.filter((budget) => inPeriod(budget.created_at, period));

    const income = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expensesTotal = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const approvedBudgets = budgets.filter((budget) => budget.status === "approved");
    const pendingBalance = approvedBudgets.reduce((sum, budget) => {
      const total = Number(budget.total_amount || 0);
      const paid = paidForBudget(budget, payments);
      return sum + Math.max(0, total - paid);
    }, 0);

    const sentOrClosed = periodBudgets.filter((budget) => ["sent", "approved", "rejected"].includes(budget.status));
    const approved = periodBudgets.filter((budget) => budget.status === "approved");
    const rejected = periodBudgets.filter((budget) => budget.status === "rejected");
    const conversion = sentOrClosed.length ? Math.round((approved.length / sentOrClosed.length) * 100) : 0;

    return {
      income,
      expensesTotal,
      result: income - expensesTotal,
      pendingBalance,
      noPayment: approvedBudgets.filter((budget) => paidForBudget(budget, payments) <= 0).length,
      partialPayment: approvedBudgets.filter((budget) => {
        const paid = paidForBudget(budget, payments);
        return paid > 0 && paid < Number(budget.total_amount || 0);
      }).length,
      budgetsSent: periodBudgets.filter((budget) => budget.status === "sent").length,
      budgetsApproved: approved.length,
      budgetsRejected: rejected.length,
      conversion,
      appointmentsCompleted: periodAppointments.filter((appointment) => ["completed", "finished"].includes(appointment.status)).length,
      appointmentsCancelled: periodAppointments.filter((appointment) => ["cancelled", "canceled"].includes(appointment.status)).length,
      appointmentsNoShow: periodAppointments.filter((appointment) => appointment.status === "no_show").length,
      newPatients: periodPatients.length,
      activePatients: patients.filter((patient) => patient.is_active !== false).length,
      archivedPatients: patients.filter((patient) => patient.status === "finished" || patient.is_active === false).length,
      activeTreatments: treatments.filter((treatment) => ["approved", "in_progress", "budgeted"].includes(treatment.status)).length,
      pendingBudgets: budgets.filter((budget) => ["draft", "sent"].includes(budget.status)).length
    };
  }, [appointments, budgets, expenses, patients, payments, period, treatments]);

  const financeRows = budgets
    .filter((budget) => budget.status === "approved")
    .map((budget) => {
      const total = Number(budget.total_amount || 0);
      const paid = paidForBudget(budget, payments);
      return { budget, total, paid, balance: Math.max(0, total - paid), state: paymentState(total, paid) };
    })
    .sort((a, b) => b.balance - a.balance);

  const recentPayments = payments.filter(activePayment);
  const recentBudgets = budgets;

  const paginatedFinanceRows = useMemo(() => {
    const start = (financePage - 1) * financePageSize;
    return financeRows.slice(start, start + financePageSize);
  }, [financeRows, financePage, financePageSize]);

  const paginatedRecentPayments = useMemo(() => {
    const start = (paymentsPage - 1) * paymentsPageSize;
    return recentPayments.slice(start, start + paymentsPageSize);
  }, [recentPayments, paymentsPage, paymentsPageSize]);

  const paginatedRecentBudgets = useMemo(() => {
    const start = (budgetsPage - 1) * budgetsPageSize;
    return recentBudgets.slice(start, start + budgetsPageSize);
  }, [recentBudgets, budgetsPage, budgetsPageSize]);

  const executiveSummary = `${periodLabels[period]}: ${formatMoney(metrics.income, settings)} ingresados, ${formatMoney(metrics.expensesTotal, settings)} en egresos, resultado ${formatMoney(metrics.result, settings)} y ${formatMoney(metrics.pendingBalance, settings)} pendientes por cobrar.`;

  function exportPatients() {
    downloadCsv("dental-pilot-pacientes.csv", ["Paciente", "Teléfono", "Email", "Estado", "Origen"], patients.map((patient) => [patient.full_name, patient.phone, patient.email || "", patient.status, patient.source || ""]));
  }

  function exportBudgets() {
    downloadCsv("dental-pilot-presupuestos.csv", ["Paciente", "Tratamiento", "Estado", "Total", "Pagado", "Saldo"], budgets.map((budget) => {
      const paid = paidForBudget(budget, payments);
      const total = Number(budget.total_amount || 0);
      return [budget.patients?.full_name || "", budget.treatments?.title || "", budgetStatusLabels[budget.status] || budget.status, total, paid, Math.max(0, total - paid)];
    }));
  }

  function exportPayments() {
    downloadCsv("dental-pilot-pagos.csv", ["Paciente", "Tratamiento", "Monto", "Método", "Fecha", "Estado"], payments.map((payment) => [payment.patients?.full_name || "", payment.treatments?.title || "", payment.amount, payment.method, payment.paid_at, payment.status]));
  }

  function exportExpenses() {
    downloadCsv("dental-pilot-egresos.csv", ["Fecha", "Categoría", "Descripción", "Monto", "Método", "Estado"], expenses.map((expense) => [expense.expense_date, expense.expense_categories?.name || "", expense.description, expense.amount, expense.payment_method, (expense.status || "active") === "active" ? "Activo" : "Anulado"]));
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Resumen ejecutivo</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{executiveSummary}</h2>
            <p className="mt-2 text-sm text-muted">Vista consolidada para entender ingresos, cobranza y operación sin revisar cada módulo.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {(Object.keys(periodLabels) as ReportPeriod[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${period === option ? "bg-primary text-white" : "bg-white text-muted hover:bg-slate-100 hover:text-ink"}`}
              >
                {periodLabels[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard title="Ingresos" value={formatMoney(metrics.income, settings)} description={`Pagos activos en ${periodLabels[period].toLowerCase()}.`} icon={<WalletCards size={22} />} tone="success" />
        <ReportCard title="Egresos" value={formatMoney(metrics.expensesTotal, settings)} description={`Gastos registrados en ${periodLabels[period].toLowerCase()}.`} icon={<WalletCards size={22} />} tone="warning" />
        <ReportCard title="Resultado" value={formatMoney(metrics.result, settings)} description="Ingresos menos egresos del periodo." icon={<TrendingUp size={22} />} tone={metrics.result >= 0 ? "success" : "warning"} />
        <ReportCard title="Conversión" value={`${metrics.conversion}%`} description="Presupuestos aprobados sobre enviados/cerrados." icon={<TrendingUp size={22} />} />
        <ReportCard title="Citas realizadas" value={String(metrics.appointmentsCompleted)} description="Citas finalizadas dentro del periodo." icon={<CalendarCheck size={22} />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-black text-ink">Cobranza pendiente</h2>
              <p className="mt-1 text-sm text-muted">Presupuestos aprobados ordenados por mayor saldo pendiente.</p>
            </div>
            <StatusPill label={`${financeRows.length} registros`} variant="primary" />
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="py-3">Paciente</th><th>Tratamiento</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFinanceRows.map(({ budget, total, paid, balance, state }) => (
                  <tr key={budget.id}>
                    <td className="py-3 font-semibold text-ink">{budget.patients?.full_name || "Paciente"}</td>
                    <td className="text-muted">{budget.treatments?.title || "Tratamiento"}</td>
                    <td className="text-muted">{formatMoney(total, settings)}</td>
                    <td className="text-muted">{formatMoney(paid, settings)}</td>
                    <td className="font-bold text-ink">{formatMoney(balance, settings)}</td>
                    <td><StatusPill label={state} variant={state === "Pagado" ? "success" : state === "Parcial" ? "primary" : "warning"} /></td>
                  </tr>
                ))}
                {financeRows.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-muted">No hay cobranza pendiente.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:hidden">
            {paginatedFinanceRows.map(({ budget, total, paid, balance, state }) => (
              <div key={budget.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{budget.patients?.full_name || "Paciente"}</p>
                    <p className="mt-1 text-muted">{budget.treatments?.title || "Tratamiento"}</p>
                  </div>
                  <StatusPill label={state} variant={state === "Pagado" ? "success" : state === "Parcial" ? "primary" : "warning"} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <p><span className="block text-muted">Total</span><b>{formatMoney(total, settings)}</b></p>
                  <p><span className="block text-muted">Pagado</span><b>{formatMoney(paid, settings)}</b></p>
                  <p><span className="block text-muted">Saldo</span><b>{formatMoney(balance, settings)}</b></p>
                </div>
              </div>
            ))}
            {financeRows.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">No hay cobranza pendiente.</p> : null}
          </div>
          <PaginationControls
            page={financePage}
            pageSize={financePageSize}
            totalItems={financeRows.length}
            onPageChange={setFinancePage}
            onPageSizeChange={setFinancePageSize}
            className="mt-4"
          />
        </div>

        <div className="card p-5">
          <h2 className="font-black text-ink">Exportaciones</h2>
          <p className="mt-1 text-sm text-muted">Descarga CSV para análisis externo.</p>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={exportPatients} className="btn-secondary justify-center"><Download size={16} /> Pacientes</button>
            <button type="button" onClick={exportBudgets} className="btn-secondary justify-center"><Download size={16} /> Presupuestos</button>
            <button type="button" onClick={exportPayments} className="btn-secondary justify-center"><Download size={16} /> Pagos</button>
            <button type="button" onClick={exportExpenses} className="btn-secondary justify-center"><Download size={16} /> Egresos</button>
          </div>
          {mode === "demo" ? <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-xs font-semibold text-primary">Demo: exporta datos ficticios.</p> : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-ink">Pagos recientes</h2>
              <p className="mt-1 text-sm text-muted">Últimos pagos registrados.</p>
            </div>
            <StatusPill label={`${recentPayments.length}`} variant="primary" />
          </div>
          <div className="mt-4 grid gap-2">
            {paginatedRecentPayments.map((payment) => (
              <CompactLine
                key={payment.id}
                primary={payment.patients?.full_name || "Paciente"}
                secondary={`${payment.treatments?.title || "Tratamiento"} · ${payment.method}`}
                amount={formatMoney(Number(payment.amount || 0), settings)}
              />
            ))}
            {recentPayments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">Todavía no hay pagos registrados.</p> : null}
          </div>
          <PaginationControls
            page={paymentsPage}
            pageSize={paymentsPageSize}
            totalItems={recentPayments.length}
            onPageChange={setPaymentsPage}
            onPageSizeChange={setPaymentsPageSize}
            className="mt-4"
          />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-ink">Presupuestos recientes</h2>
              <p className="mt-1 text-sm text-muted">Últimos presupuestos generados.</p>
            </div>
            <StatusPill label={`${recentBudgets.length}`} variant="primary" />
          </div>
          <div className="mt-4 grid gap-2">
            {paginatedRecentBudgets.map((budget) => (
              <CompactLine
                key={budget.id}
                primary={budget.patients?.full_name || "Paciente"}
                secondary={budget.treatments?.title || "Tratamiento"}
                amount={formatMoney(Number(budget.total_amount || 0), settings)}
                badge={<StatusPill label={budgetStatusLabels[budget.status] || budget.status} variant={budget.status === "approved" ? "success" : budget.status === "rejected" ? "danger" : "warning"} />}
              />
            ))}
            {recentBudgets.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">Todavía no hay presupuestos registrados.</p> : null}
          </div>
          <PaginationControls
            page={budgetsPage}
            pageSize={budgetsPageSize}
            totalItems={recentBudgets.length}
            onPageChange={setBudgetsPage}
            onPageSizeChange={setBudgetsPageSize}
            className="mt-4"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h2 className="text-lg font-black text-ink">Detalle complementario</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Enviados" value={String(metrics.budgetsSent)} description="Presupuestos enviados dentro del periodo." icon={<FileText size={22} />} />
          <ReportCard title="Aprobados" value={String(metrics.budgetsApproved)} description="Presupuestos aprobados dentro del periodo." icon={<TrendingUp size={22} />} tone="success" />
          <ReportCard title="No asistió" value={String(metrics.appointmentsNoShow)} description="Pacientes que no asistieron a su cita." icon={<CalendarCheck size={22} />} tone="warning" />
          <ReportCard title="Nuevos pacientes" value={String(metrics.newPatients)} description="Pacientes creados dentro del periodo." icon={<Users size={22} />} />
        </div>
      </section>
    </div>
  );
}
