export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { PaymentManager } from "@/components/payments/payment-manager";
import { getBudgets, getClinicSettings, getPayments } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function PaymentsPage() {
  const [settings, budgets, payments] = await Promise.all([getClinicSettings(), getBudgets(), getPayments()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Pagos e ingresos</h1>
        <p className="max-w-3xl text-muted">Registra pagos totales o parciales sobre presupuestos aprobados, controla saldos pendientes y revisa el historial financiero.</p>
      </div>
      <PaymentManager settings={settings} budgets={budgets} payments={payments} />
    </AppShell>
  );
}
