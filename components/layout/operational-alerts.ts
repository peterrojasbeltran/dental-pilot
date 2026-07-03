import type { OperationalAlert } from "./topbar";
import { getAppointments, getBudgets, getInventoryItems, getPatients, getTreatments } from "@/lib/data";
import { demoAppointments, demoBudgets, demoInventoryItems, demoPatients, demoTreatments } from "@/lib/demo-data";

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function getGlobalOperationalAlerts(mode: "app" | "demo" = "app"): Promise<OperationalAlert[]> {
  try {
    const [patients, appointments, treatments, budgets, inventoryItems] = mode === "demo"
      ? [demoPatients, demoAppointments, demoTreatments, demoBudgets, demoInventoryItems]
      : await Promise.all([
          getPatients(),
          getAppointments(),
          getTreatments(),
          getBudgets(),
          getInventoryItems(),
        ]);

    const prefix = mode === "demo" ? "/demo" : "";
    const todayStart = startOfToday();
    const activeAppointmentStatuses = ["pending", "scheduled", "confirmed", "in_progress"];
    const pendingAppointmentStatuses = ["pending", "scheduled"];

    const activeFutureAppointments = appointments
      .filter((appointment) => activeAppointmentStatuses.includes(appointment.status))
      .filter((appointment) => new Date(appointment.starts_at).getTime() >= todayStart.getTime());

    const pendingAppointments = activeFutureAppointments.filter((appointment) =>
      pendingAppointmentStatuses.includes(appointment.status),
    );

    const patientIdsWithFutureAppointment = new Set(
      activeFutureAppointments.map((appointment) => appointment.patient_id).filter(Boolean),
    );

    const scheduledPatientsWithoutFutureAppointment = patients.filter(
      (patient) => patient.status === "scheduled" && !patientIdsWithFutureAppointment.has(patient.id),
    );

    const pendingBudgets = budgets.filter((budget) => ["draft", "sent"].includes(budget.status));
    const approvedBudgetsWithoutFullPayment = budgets.filter(
      (budget) => budget.status === "approved" && Number(budget.paid_amount || 0) < Number(budget.total_amount || 0),
    );

    const treatmentPatientIdsWithFutureAppointment = new Set(
      activeFutureAppointments.map((appointment) => appointment.patient_id).filter(Boolean),
    );
    const activeTreatmentsWithoutAppointment = treatments.filter((treatment) =>
      ["approved", "in_progress", "budgeted"].includes(treatment.status) &&
      treatment.patient_id &&
      !treatmentPatientIdsWithFutureAppointment.has(treatment.patient_id),
    );

    const lowStockItems = inventoryItems.filter(
      (item) => item.is_active !== false && Number(item.current_stock || 0) <= Number(item.minimum_stock || 0),
    );

    return [
      ...(pendingAppointments.length > 0
        ? [{
            title: `${pendingAppointments.length} cita(s) pendientes de confirmar`,
            description: "Revisa la agenda y confirma asistencia.",
            href: `${prefix}/appointments`,
            tone: "warning" as const,
          }]
        : []),
      ...(scheduledPatientsWithoutFutureAppointment.length > 0
        ? [{
            title: `${scheduledPatientsWithoutFutureAppointment.length} paciente(s) agendados sin cita futura`,
            description: "Hay pacientes en CRM Agendado sin una próxima cita activa.",
            href: `${prefix}/patients`,
            tone: "warning" as const,
          }]
        : []),
      ...(pendingBudgets.length > 0
        ? [{
            title: `${pendingBudgets.length} presupuesto(s) pendientes`,
            description: "Presupuestos en borrador o enviados que requieren seguimiento.",
            href: `${prefix}/treatments`,
            tone: "info" as const,
          }]
        : []),
      ...(approvedBudgetsWithoutFullPayment.length > 0
        ? [{
            title: `${approvedBudgetsWithoutFullPayment.length} presupuesto(s) aprobado(s) con saldo`,
            description: "Revisa cobranza y pagos pendientes.",
            href: `${prefix}/payments`,
            tone: "warning" as const,
          }]
        : []),
      ...(activeTreatmentsWithoutAppointment.length > 0
        ? [{
            title: `${activeTreatmentsWithoutAppointment.length} tratamiento(s) sin próxima cita`,
            description: "Hay tratamientos activos que requieren agendar seguimiento.",
            href: `${prefix}/treatments`,
            tone: "warning" as const,
          }]
        : []),
      ...(lowStockItems.length > 0
        ? [{
            title: `${lowStockItems.length} insumo(s) con stock bajo`,
            description: "Revisa inventario y repón insumos críticos.",
            href: `${prefix}/inventory`,
            tone: "warning" as const,
          }]
        : []),
    ];
  } catch {
    return [{
      title: "No pudimos cargar alertas",
      description: "Verifica la conexión con la base de datos e intenta nuevamente.",
      href: mode === "demo" ? "/demo/dashboard" : "/dashboard",
      tone: "warning",
    }];
  }
}
