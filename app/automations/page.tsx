export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { AutomationManager } from "@/components/automations/automation-manager";
import { getAutomationHistory, getAutomationRules, getAutomationTemplates } from "@/lib/data";
import { APP_VERSION } from "@/lib/version";

export default async function AutomationsPage() {
  const [rules, templates, history] = await Promise.all([
    getAutomationRules(),
    getAutomationTemplates(),
    getAutomationHistory()
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label={APP_VERSION} variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Automatizaciones</h1>
        <p className="max-w-3xl text-muted">Configura recordatorios, seguimiento de presupuestos, recuperación y cumpleaños. En esta versión el envío es simulado y queda preparado para WhatsApp.</p>
      </div>
      <AutomationManager rules={rules} templates={templates} history={history} />
    </AppShell>
  );
}
