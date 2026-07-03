export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { getInventoryItems, getInventoryMovements } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function Page() {
  const [items, movements] = await Promise.all([getInventoryItems(), getInventoryMovements()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Inventario básico</h1>
        <p className="max-w-3xl text-muted">Control simple de insumos para consultorios pequeños: stock actual, mínimo, entradas, salidas y alertas.</p>
      </div>
      <InventoryManager items={items} movements={movements} />
    </AppShell>
  );
}
