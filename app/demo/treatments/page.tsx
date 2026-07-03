import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { TreatmentBudgetManager } from "@/components/treatments/treatment-budget-manager";
import { demoBudgets, demoClinicSettings, demoPatients, demoServices, demoTreatments } from "@/lib/demo-data";

export default function DemoTreatmentsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-2">
        <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Tratamientos y presupuestos</h1>
        <p className="max-w-3xl text-muted">Explora el flujo comercial de una clínica: tratamiento, presupuesto, aprobación y avance CRM.</p>
      </div>
      <TreatmentBudgetManager mode="demo" settings={demoClinicSettings} patients={demoPatients} services={demoServices} treatments={demoTreatments} budgets={demoBudgets} />
    </AppShell>
  );
}
