import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { demoAppointments, demoBudgets, demoClinicSettings, demoExpenses, demoPatients, demoPayments, demoTreatments } from "@/lib/demo-data";
import { APP_VERSION } from "@/lib/version";

export default function DemoReportsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label={`DEMO MODE · ${APP_VERSION}`} variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Reportes y métricas</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista de demostración con datos ficticios. Las exportaciones usan información mock.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>
      <ReportsDashboard settings={demoClinicSettings} patients={demoPatients} appointments={demoAppointments} treatments={demoTreatments} budgets={demoBudgets} payments={demoPayments} expenses={demoExpenses} mode="demo" />
    </AppShell>
  );
}
