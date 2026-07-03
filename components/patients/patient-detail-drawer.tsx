"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ClipboardList, CreditCard, FileText, History, UserRound, X } from "lucide-react";
import type { Appointment, Budget, ClinicSettings, Patient, Payment, Treatment } from "@/types/database";
import { StatusPill } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/currency";
import { getRiskVariant, patientStatusLabel, riskLabel } from "@/modules/patients/status";
import { buildPatientAiSummary } from "@/lib/ai-insights";

type Patient360Props = {
  patient: Patient | null;
  settings: ClinicSettings;
  appointments?: Appointment[];
  treatments?: Treatment[];
  budgets?: Budget[];
  payments?: Payment[];
  onClose: () => void;
};

type TabKey = "summary" | "appointments" | "treatments" | "budgets" | "payments" | "activity";

const appointmentStatusLabel: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En curso",
  completed: "Finalizada",
  cancelled: "Cancelada",
  no_show: "No asistió"
};

const treatmentStatusLabel: Record<string, string> = {
  pending: "Pendiente",
  budgeted: "Presupuestado",
  approved: "Aprobado",
  in_progress: "En ejecución",
  finished: "Finalizado",
  cancelled: "Cancelado"
};

const budgetStatusLabel: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido"
};

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  try {
    return new Date(value).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  try {
    return new Date(value).toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function appointmentVariant(status: string) {
  if (status === "confirmed" || status === "in_progress") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "cancelled" || status === "no_show") return "danger" as const;
  return "neutral" as const;
}

function treatmentVariant(status: string) {
  if (status === "in_progress" || status === "approved") return "success" as const;
  if (status === "budgeted" || status === "pending") return "warning" as const;
  if (status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

function budgetVariant(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "sent" || status === "draft") return "warning" as const;
  if (status === "rejected" || status === "expired") return "danger" as const;
  return "neutral" as const;
}

export function PatientDetailDrawer({ patient, settings, appointments = [], treatments = [], budgets = [], payments = [], onClose }: Patient360Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  const patientAppointments = useMemo(() => {
    if (!patient) return [];
    return appointments
      .filter((appointment) => appointment.patient_id === patient.id || appointment.patients?.phone === patient.phone || appointment.patients?.full_name === patient.full_name)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [appointments, patient]);

  const patientTreatments = useMemo(() => {
    if (!patient) return [];
    return treatments
      .filter((treatment) => treatment.patient_id === patient.id || treatment.patients?.full_name === patient.full_name)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [patient, treatments]);

  const patientBudgets = useMemo(() => {
    if (!patient) return [];
    return budgets
      .filter((budget) => budget.patient_id === patient.id || budget.patients?.full_name === patient.full_name)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [budgets, patient]);

  const patientPayments = useMemo(() => {
    if (!patient) return [];
    return payments
      .filter((payment) => payment.patient_id === patient.id || payment.patients?.phone === patient.phone || payment.patients?.full_name === patient.full_name)
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }, [patient, payments]);

  const activePatientPayments = patientPayments.filter((payment) => payment.status !== "voided");
  const totalPaid = activePatientPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const approvedBudgetTotal = patientBudgets.filter((budget) => budget.status === "approved").reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);
  const patientBalance = Math.max(0, approvedBudgetTotal - totalPaid);
  const aiContext = patient ? buildPatientAiSummary({ patient, appointments, treatments, budgets, payments }) : null;

  const upcomingAppointment = useMemo(() => {
    const now = Date.now();
    return patientAppointments
      .filter((appointment) => new Date(appointment.starts_at).getTime() >= now && !["completed", "cancelled", "no_show"].includes(appointment.status))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  }, [patientAppointments]);

  const activeTreatment = patientTreatments.find((treatment) => ["approved", "in_progress", "budgeted"].includes(treatment.status));
  const latestBudget = patientBudgets[0];

  const activity = useMemo(() => {
    if (!patient) return [];
    return [
      { id: "created", date: patient.created_at, title: "Paciente creado", description: patient.source ? `Origen: ${patient.source}` : "Registro inicial" },
      ...patientAppointments.slice(0, 4).map((appointment) => ({ id: `appt-${appointment.id}`, date: appointment.starts_at, title: `Cita ${appointmentStatusLabel[appointment.status] || appointment.status}`, description: `${appointment.services?.name || "Servicio sin asignar"} · ${appointment.doctor_name || "Sin doctor"}` })),
      ...patientTreatments.slice(0, 4).map((treatment) => ({ id: `treat-${treatment.id}`, date: treatment.created_at, title: `Tratamiento ${treatmentStatusLabel[treatment.status] || treatment.status}`, description: `${treatment.title} · ${formatMoney(treatment.total_amount || 0, settings)}` })),
      ...patientBudgets.slice(0, 4).map((budget) => ({ id: `budget-${budget.id}`, date: budget.created_at, title: `Presupuesto ${budgetStatusLabel[budget.status] || budget.status}`, description: `Total ${formatMoney(budget.total_amount || 0, settings)}` })),
      ...patientPayments.slice(0, 4).map((payment) => ({ id: `payment-${payment.id}`, date: payment.paid_at, title: payment.status === "voided" ? "Pago anulado" : "Pago registrado", description: `${formatMoney(payment.amount || 0, settings)} · ${payment.method}` }))
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 10);
  }, [patient, patientAppointments, patientBudgets, patientPayments, patientTreatments, settings]);

  if (!patient) return null;

  const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: "summary", label: "Resumen", icon: <UserRound size={15} /> },
    { key: "appointments", label: "Agenda", icon: <CalendarDays size={15} /> },
    { key: "treatments", label: "Tratamientos", icon: <ClipboardList size={15} /> },
    { key: "budgets", label: "Presupuestos", icon: <FileText size={15} /> },
    { key: "payments", label: "Pagos", icon: <CreditCard size={15} /> },
    { key: "activity", label: "Actividad", icon: <History size={15} /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="Cerrar ficha del paciente" onClick={onClose} />
      <aside className="relative h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Ficha 360° del paciente</p>
              <h2 className="mt-1 truncate text-2xl font-bold text-ink">{patient.full_name}</h2>
              <p className="mt-1 text-sm text-muted">{patient.phone} · {patient.email || "Sin correo"} · {patient.source || "manual"}</p>
            </div>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-ink" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                  activeTab === tab.key ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-5 sm:p-7">
          {activeTab === "summary" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusPill label={patientStatusLabel[patient.status]} variant="primary" />
                <StatusPill label={`Riesgo ${riskLabel[patient.risk_level]}`} variant={getRiskVariant(patient.risk_level)} />
                <StatusPill label={patient.is_active === false ? "Inactivo" : "Activo"} variant={patient.is_active === false ? "neutral" : "success"} />
              </div>

              <section className="grid gap-3 lg:grid-cols-4">
                <SummaryCard label="Próxima cita" value={upcomingAppointment ? formatDateTime(upcomingAppointment.starts_at) : "Sin cita futura"} help={upcomingAppointment?.services?.name || ""} />
                <SummaryCard label="Tratamiento activo" value={activeTreatment?.title || patient.active_treatment || "Sin tratamiento"} help={activeTreatment ? treatmentStatusLabel[activeTreatment.status] : ""} />
                <SummaryCard label="Último presupuesto" value={latestBudget ? formatMoney(latestBudget.total_amount || 0, settings) : "Sin presupuesto"} help={latestBudget ? budgetStatusLabel[latestBudget.status] : ""} />
                <SummaryCard label="Pagado / saldo" value={`${formatMoney(totalPaid, settings)} / ${formatMoney(patientBalance, settings)}`} help="Pagos activos" />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                  <p className="text-sm font-bold text-primary">Resumen IA</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{aiContext?.summary || patient.ai_summary || "Todavía no existe resumen IA para este paciente."}</p>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
                  <p className="text-sm font-bold text-emerald-700">Siguiente acción sugerida</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{aiContext?.recommendation || patient.next_action || "Definir próximo paso comercial."}</p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-100 p-5">
                <p className="text-sm font-bold text-ink">Notas internas</p>
                <p className="mt-2 text-sm leading-6 text-muted">{patient.notes || "Sin notas registradas."}</p>
              </section>
            </div>
          ) : null}

          {activeTab === "appointments" ? (
            <ListSection empty="Sin citas registradas para este paciente.">
              {patientAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{formatDateTime(appointment.starts_at)}</p>
                      <p className="mt-1 text-sm text-muted">{appointment.services?.name || "Servicio sin asignar"} · {appointment.doctor_name || "Sin doctor"}</p>
                      {appointment.notes ? <p className="mt-2 text-sm text-slate-600">{appointment.notes}</p> : null}
                    </div>
                    <StatusPill label={appointmentStatusLabel[appointment.status] || appointment.status} variant={appointmentVariant(appointment.status)} />
                  </div>
                </article>
              ))}
            </ListSection>
          ) : null}

          {activeTab === "treatments" ? (
            <ListSection empty="Sin tratamientos registrados para este paciente.">
              {patientTreatments.map((treatment) => (
                <article key={treatment.id} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{treatment.title}</p>
                      <p className="mt-1 text-sm text-muted">Inicio: {formatDate(treatment.start_date)} · Estimado: {formatDate(treatment.estimated_end_date)}</p>
                      <p className="mt-2 text-sm font-bold text-ink">{formatMoney(treatment.total_amount || 0, settings)}</p>
                    </div>
                    <StatusPill label={treatmentStatusLabel[treatment.status] || treatment.status} variant={treatmentVariant(treatment.status)} />
                  </div>
                  {treatment.treatment_services?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {treatment.treatment_services.map((item) => <span key={item.id} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{item.services?.name || "Servicio"}</span>)}
                    </div>
                  ) : null}
                </article>
              ))}
            </ListSection>
          ) : null}

          {activeTab === "budgets" ? (
            <ListSection empty="Sin presupuestos registrados para este paciente.">
              {patientBudgets.map((budget) => (
                <article key={budget.id} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">Presupuesto {budget.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm text-muted">{budget.treatments?.title || "Tratamiento sin título"} · {formatDate(budget.created_at)}</p>
                      <p className="mt-2 text-sm font-bold text-ink">{formatMoney(budget.total_amount || 0, settings)}</p>
                    </div>
                    <StatusPill label={budgetStatusLabel[budget.status] || budget.status} variant={budgetVariant(budget.status)} />
                  </div>
                </article>
              ))}
            </ListSection>
          ) : null}

          {activeTab === "payments" ? (
            <ListSection empty="Sin pagos registrados para este paciente.">
              {patientPayments.map((payment) => (
                <article key={payment.id} className={`rounded-3xl border border-slate-100 p-4 ${payment.status === "voided" ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{formatMoney(payment.amount || 0, settings)}</p>
                      <p className="mt-1 text-sm text-muted">{formatDateTime(payment.paid_at)} · {payment.method}</p>
                      {payment.notes ? <p className="mt-2 text-sm text-slate-600">{payment.notes}</p> : null}
                    </div>
                    <StatusPill label={payment.status === "voided" ? "Anulado" : "Activo"} variant={payment.status === "voided" ? "neutral" : "success"} />
                  </div>
                </article>
              ))}
            </ListSection>
          ) : null}

          {activeTab === "activity" ? (
            <ListSection empty="Sin actividad registrada para este paciente.">
              {activity.map((item) => (
                <article key={item.id} className="relative rounded-3xl border border-slate-100 p-4 pl-5">
                  <span className="absolute left-0 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{formatDateTime(item.date)}</p>
                  <p className="mt-1 font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </article>
              ))}
            </ListSection>
          ) : null}
        </main>
      </aside>
    </div>
  );
}

function SummaryCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
      {help ? <p className="mt-1 text-xs text-muted">{help}</p> : null}
    </div>
  );
}

function ListSection({ children, empty }: { children: ReactNode; empty: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="space-y-3">{hasChildren ? children : <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted">{empty}</div>}</div>;
}
