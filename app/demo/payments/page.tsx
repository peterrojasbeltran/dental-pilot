import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { PaymentManager } from "@/components/payments/payment-manager";
import { demoBudgets, demoClinicSettings, demoPayments } from "@/lib/demo-data";
import { APP_VERSION } from "@/lib/version";

export default function DemoPaymentsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label={`DEMO MODE · ${APP_VERSION}`} variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Pagos e ingresos</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista de demostración con datos ficticios. Los pagos no se guardan en modo demo.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>
      <PaymentManager settings={demoClinicSettings} budgets={demoBudgets} payments={demoPayments} mode="demo" />
    </AppShell>
  );
}
