export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { FinanceManager } from "@/components/finances/finance-manager";
import { getClinicSettings, getExpenseCategories, getExpenses, getPayments } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function FinancesPage() {
  const [settings, payments, expenses, categories] = await Promise.all([
    getClinicSettings(),
    getPayments(),
    getExpenses(),
    getExpenseCategories()
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Finanzas básicas</h1>
        <p className="max-w-3xl text-muted">Registra egresos simples y revisa el resultado de ingresos menos gastos del consultorio.</p>
      </div>
      <FinanceManager settings={settings} payments={payments} expenses={expenses} categories={categories} />
    </AppShell>
  );
}
