export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { getAppointments, getBudgets, getClinicSettings, getExpenses, getPatients, getPayments, getTreatments } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function ReportsPage() {
  const [settings, patients, appointments, treatments, budgets, payments, expenses] = await Promise.all([
    getClinicSettings(),
    getPatients(),
    getAppointments(),
    getTreatments(),
    getBudgets(),
    getPayments(),
    getExpenses()
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Reportes y métricas</h1>
        <p className="max-w-3xl text-muted">Consulta la salud financiera, comercial y operativa de la clínica con datos reales del sistema.</p>
      </div>
      <ReportsDashboard settings={settings} patients={patients} appointments={appointments} treatments={treatments} budgets={budgets} payments={payments} expenses={expenses} />
    </AppShell>
  );
}
