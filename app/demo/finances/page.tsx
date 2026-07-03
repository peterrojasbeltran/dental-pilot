import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { FinanceManager } from "@/components/finances/finance-manager";
import { demoClinicSettings, demoExpenseCategories, demoExpenses, demoPayments } from "@/lib/demo-data";
import { APP_VERSION } from "@/lib/version";

export default function DemoFinancesPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label={`DEMO MODE · ${APP_VERSION}`} variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Finanzas básicas</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista demo con egresos ficticios y modo solo lectura.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>
      <FinanceManager settings={demoClinicSettings} payments={demoPayments} expenses={demoExpenses} categories={demoExpenseCategories} mode="demo" />
    </AppShell>
  );
}
