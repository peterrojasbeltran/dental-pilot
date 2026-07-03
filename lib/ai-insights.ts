import type { Appointment, Budget, InventoryItem, Patient, Payment, Treatment } from "@/types/database";

export type AiInsightPriority = "alta" | "media" | "baja";
export type AiInsightKind = "riesgo" | "cobranza" | "agenda" | "inventario" | "recuperacion" | "seguimiento";

export type AiInsight = {
  id: string;
  kind: AiInsightKind;
  title: string;
  description: string;
  recommendation: string;
  priority: AiInsightPriority;
  href: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const activeAppointmentStatuses = ["pending", "scheduled", "confirmed", "in_progress"];
const closedAppointmentStatuses = ["completed", "finished", "cancelled", "canceled", "no_show"];

function daysBetween(value?: string | null, now = new Date()) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

function hasFutureAppointment(patient: Patient, appointments: Appointment[], now = new Date()) {
  return appointments.some((appointment) => {
    const startsAt = new Date(appointment.starts_at).getTime();
    const belongsToPatient = appointment.patient_id === patient.id || appointment.patients?.phone === patient.phone || appointment.patients?.full_name === patient.full_name;
    return belongsToPatient && startsAt >= now.getTime() && activeAppointmentStatuses.includes(appointment.status) && !closedAppointmentStatuses.includes(appointment.status);
  });
}

function paidAmountForBudget(budget: Budget, payments: Payment[]) {
  const explicitPaid = Number(budget.paid_amount || 0);
  const paidFromPayments = payments
    .filter((payment) => payment.status !== "voided" && payment.budget_id === budget.id)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(explicitPaid, paidFromPayments);
}

export function buildAiInsights(input: {
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  budgets: Budget[];
  payments: Payment[];
  inventoryItems: InventoryItem[];
  now?: Date;
}): AiInsight[] {
  const { patients, appointments, treatments, budgets, payments, inventoryItems, now = new Date() } = input;
  const insights: AiInsight[] = [];

  patients.forEach((patient) => {
    const inactivityDays = daysBetween(patient.last_contact_at || patient.created_at, now);
    const futureAppointment = hasFutureAppointment(patient, appointments, now);

    if ((patient.status === "recovery" || patient.status === "inactive" || patient.risk_level === "high") && !futureAppointment) {
      insights.push({
        id: `risk-${patient.id}`,
        kind: "riesgo",
        priority: "alta",
        title: `${patient.full_name} requiere seguimiento`,
        description: inactivityDays ? `Paciente con ${inactivityDays} días sin actividad registrada.` : "Paciente marcado con riesgo alto o recuperación.",
        recommendation: "Contactar y ofrecer una cita de control o reprogramación.",
        href: "/patients"
      });
    }

    if (patient.status === "scheduled" && !futureAppointment) {
      insights.push({
        id: `scheduled-no-appointment-${patient.id}`,
        kind: "agenda",
        priority: "media",
        title: `${patient.full_name} está agendado sin cita futura`,
        description: "El CRM indica estado Agendado, pero no existe una próxima cita activa.",
        recommendation: "Crear o confirmar una cita para mantener el flujo actualizado.",
        href: "/appointments"
      });
    }
  });

  budgets.forEach((budget) => {
    if (budget.status !== "approved") return;
    const total = Number(budget.total_amount || 0);
    const paid = paidAmountForBudget(budget, payments);
    const balance = Math.max(0, total - paid);
    if (balance <= 0) return;

    insights.push({
      id: `budget-balance-${budget.id}`,
      kind: "cobranza",
      priority: paid > 0 ? "media" : "alta",
      title: `${budget.patients?.full_name || "Paciente"} tiene saldo pendiente`,
      description: `Presupuesto aprobado con saldo pendiente de Bs ${balance.toLocaleString("es-BO")}.`,
      recommendation: paid > 0 ? "Registrar seguimiento de cobranza o acordar siguiente pago." : "Solicitar pago inicial para activar el tratamiento.",
      href: "/payments"
    });
  });

  treatments.forEach((treatment) => {
    if (!["approved", "in_progress"].includes(treatment.status)) return;
    const patient = patients.find((item) => item.id === treatment.patient_id || item.full_name === treatment.patients?.full_name);
    if (!patient) return;
    if (hasFutureAppointment(patient, appointments, now)) return;

    insights.push({
      id: `treatment-no-appointment-${treatment.id}`,
      kind: "seguimiento",
      priority: treatment.status === "in_progress" ? "alta" : "media",
      title: `${treatment.title} sin próxima cita`,
      description: `${patient.full_name} tiene un tratamiento ${treatment.status === "in_progress" ? "en ejecución" : "aprobado"} sin cita futura.`,
      recommendation: "Agendar el siguiente control para evitar abandono del tratamiento.",
      href: "/appointments"
    });
  });

  inventoryItems
    .filter((item) => item.is_active !== false && Number(item.current_stock || 0) <= Number(item.minimum_stock || 0))
    .forEach((item) => {
      insights.push({
        id: `inventory-${item.id}`,
        kind: "inventario",
        priority: "media",
        title: `${item.name} en stock bajo`,
        description: `Stock actual ${item.current_stock} ${item.unit}. Mínimo recomendado ${item.minimum_stock} ${item.unit}.`,
        recommendation: "Revisar reposición antes de que afecte la atención.",
        href: "/inventory"
      });
    });

  return insights.sort((a, b) => {
    const weight: Record<AiInsightPriority, number> = { alta: 3, media: 2, baja: 1 };
    return weight[b.priority] - weight[a.priority];
  });
}

export function buildPatientAiSummary(input: {
  patient: Patient;
  appointments: Appointment[];
  treatments: Treatment[];
  budgets: Budget[];
  payments: Payment[];
  now?: Date;
}) {
  const { patient, appointments, treatments, budgets, payments, now = new Date() } = input;
  const patientAppointments = appointments.filter((appointment) => appointment.patient_id === patient.id || appointment.patients?.phone === patient.phone || appointment.patients?.full_name === patient.full_name);
  const patientTreatments = treatments.filter((treatment) => treatment.patient_id === patient.id || treatment.patients?.full_name === patient.full_name);
  const patientBudgets = budgets.filter((budget) => budget.patient_id === patient.id || budget.patients?.full_name === patient.full_name);
  const patientPayments = payments.filter((payment) => payment.status !== "voided" && (payment.patient_id === patient.id || payment.patients?.phone === patient.phone || payment.patients?.full_name === patient.full_name));

  const activeTreatments = patientTreatments.filter((treatment) => ["approved", "in_progress", "budgeted"].includes(treatment.status));
  const approvedBudgets = patientBudgets.filter((budget) => budget.status === "approved");
  const totalApproved = approvedBudgets.reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);
  const totalPaid = patientPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(0, totalApproved - totalPaid);
  const futureAppointment = hasFutureAppointment(patient, appointments, now);
  const inactivityDays = daysBetween(patient.last_contact_at || patient.created_at, now);

  const riskLevel: AiInsightPriority = patient.risk_level === "high" || (!futureAppointment && (inactivityDays || 0) >= 90) || balance > 0 ? "alta" : patient.risk_level === "medium" ? "media" : "baja";

  const recommendation = (() => {
    if (balance > 0) return "Priorizar seguimiento de pago pendiente antes de avanzar con nuevos servicios.";
    if (!futureAppointment && activeTreatments.length > 0) return "Agendar próximo control para mantener continuidad del tratamiento.";
    if (!futureAppointment && (inactivityDays || 0) >= 90) return "Activar recuperación preventiva y ofrecer cita de control.";
    if (futureAppointment) return "Mantener recordatorio de cita y confirmar asistencia 24 horas antes.";
    return "Mantener seguimiento comercial según próxima interacción.";
  })();

  const summary = [
    `${patient.full_name} tiene ${patientAppointments.length} cita(s) registradas.`,
    `${activeTreatments.length} tratamiento(s) activo(s) o en seguimiento.`,
    `${patientBudgets.length} presupuesto(s) asociado(s).`,
    `Saldo pendiente estimado: Bs ${balance.toLocaleString("es-BO")}.`
  ].join(" ");

  return { summary, recommendation, riskLevel, balance, activeTreatments: activeTreatments.length, appointments: patientAppointments.length };
}
