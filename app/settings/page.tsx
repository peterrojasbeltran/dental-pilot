export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { OperationalSettingsManager } from "@/components/settings/operational-settings-manager";
import { StatusPill } from "@/components/ui/status-pill";
import { getClinicSettings, getConsultingRooms, getDoctors } from "@/lib/data";

export default async function SettingsPage() {
  const [settings, doctors, consultingRooms] = await Promise.all([getClinicSettings(), getDoctors(), getConsultingRooms()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label="Editable por clínica" variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Configuración de clínica</h1>
        <p className="max-w-3xl text-muted">Define los datos de la clínica y el país. La moneda, símbolo, zona horaria y formato regional se cargan automáticamente.</p>
      </div>
      <SettingsForm settings={settings} />
      <OperationalSettingsManager doctors={doctors} consultingRooms={consultingRooms} />
    </AppShell>
  );
}
