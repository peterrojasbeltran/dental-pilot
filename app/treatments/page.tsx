export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { TreatmentBudgetManager } from "@/components/treatments/treatment-budget-manager";
import { getBudgets, getClinicSettings, getPatients, getServices, getTreatments } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function TreatmentsPage() {
  const [settings, patients, services, treatments, budgets] = await Promise.all([getClinicSettings(), getPatients(), getServices(), getTreatments(), getBudgets()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Tratamientos y presupuestos</h1>
        <p className="max-w-3xl text-muted">Crea planes de tratamiento usando servicios activos, genera presupuestos y sincroniza el estado comercial del paciente.</p>
      </div>
      <TreatmentBudgetManager settings={settings} patients={patients} services={services} treatments={treatments} budgets={budgets} />
    </AppShell>
  );
}
