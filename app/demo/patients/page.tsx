import { AppShell } from "@/components/layout/app-shell";
import { CrmKanban } from "@/components/patients/crm-kanban";
import { PatientTable } from "@/components/patients/patient-table";
import { StatusPill } from "@/components/ui/status-pill";
import { demoAppointments, demoBudgets, demoClinicSettings, demoPatients, demoPayments, demoTreatments } from "@/lib/demo-data";

export default function DemoPatientsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-2">
        <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Pacientes y CRM</h1>
        <p className="max-w-3xl text-muted">Pipeline comercial, ficha rápida, riesgo y próximas acciones sugeridas. Puedes mover tarjetas para probar la experiencia; los cambios no se guardan.</p>
      </div>

      <CrmKanban patients={demoPatients} settings={demoClinicSettings} appointments={demoAppointments} treatments={demoTreatments} budgets={demoBudgets} payments={demoPayments} demoMode />

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Listado de pacientes</h2>
          <StatusPill label={`${demoPatients.length} pacientes demo`} variant="success" />
        </div>
        <PatientTable patients={demoPatients} settings={demoClinicSettings} appointments={demoAppointments} treatments={demoTreatments} budgets={demoBudgets} payments={demoPayments} />
      </section>
    </AppShell>
  );
}
