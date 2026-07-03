export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { demoInventoryItems, demoInventoryMovements } from "@/lib/demo-data";
import { APP_VERSION } from "@/lib/version";

export default function DemoInventoryPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-2">
        <StatusPill label={`${APP_VERSION} · Demo`} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Inventario básico</h1>
        <p className="max-w-3xl text-muted">Demo con datos ficticios. En modo demo no se modifican registros reales.</p>
      </div>
      <InventoryManager items={demoInventoryItems as any} movements={demoInventoryMovements as any} mode="demo" />
    </AppShell>
  );
}
