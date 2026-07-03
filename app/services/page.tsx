export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ServiceManager } from "@/components/services/service-manager";
import { StatusPill } from "@/components/ui/status-pill";
import { getClinicSettings, getServices } from "@/lib/data";

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([getClinicSettings(), getServices()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label="Catálogo operativo" variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Servicios y precios</h1>
        <p className="max-w-3xl text-muted">Crea y administra los servicios que se usarán en agenda, presupuestos, tratamientos e IA.</p>
      </div>
      <ServiceManager services={services} settings={settings} />
    </AppShell>
  );
}
