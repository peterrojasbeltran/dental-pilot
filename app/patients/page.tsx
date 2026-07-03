export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { CrmKanban } from "@/components/patients/crm-kanban";
import { PatientManager } from "@/components/patients/patient-manager";
import { PatientTable } from "@/components/patients/patient-table";
import { getAppointments, getBudgets, getClinicSettings, getPatients, getPayments, getTreatments } from "@/lib/data";

export default async function PatientsPage() {
  const [patients, settings, appointments, treatments, budgets, payments] = await Promise.all([getPatients(), getClinicSettings(), getAppointments(), getTreatments(), getBudgets(), getPayments()]);
  const highRisk = patients.filter((patient) => patient.risk_level === "high").length;
  const recovery = patients.filter((patient) => patient.status === "recovery" || patient.status === "inactive").length;

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label="Pacientes + CRM" variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Pacientes / CRM</h1>
        <p className="max-w-3xl text-muted">Alta de pacientes, búsqueda, pipeline comercial, ficha rápida, riesgo y próximas acciones.</p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-muted">Pacientes registrados</p><p className="mt-2 text-3xl font-bold text-ink">{patients.length}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Alto riesgo</p><p className="mt-2 text-3xl font-bold text-ink">{highRisk}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Recuperación / inactivos</p><p className="mt-2 text-3xl font-bold text-ink">{recovery}</p></div>
      </section>

      <PatientManager patients={patients} />
      <CrmKanban patients={patients} settings={settings} appointments={appointments} treatments={treatments} budgets={budgets} payments={payments} />
      <PatientTable patients={patients} settings={settings} appointments={appointments} treatments={treatments} budgets={budgets} payments={payments} />
    </AppShell>
  );
}
