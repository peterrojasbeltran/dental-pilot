import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { AutomationManager } from "@/components/automations/automation-manager";
import { demoAutomationHistory, demoAutomationRules, demoAutomationTemplates } from "@/lib/demo-data";
import { APP_VERSION } from "@/lib/version";

export default function DemoAutomationsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill label={`DEMO MODE · ${APP_VERSION}`} variant="primary" />
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Automatizaciones</h1>
          <p className="mt-2 max-w-3xl text-muted">Vista de demostración con reglas y plantillas ficticias en modo solo lectura.</p>
        </div>
        <Link href="/login" className="btn-primary">Ingresar al sistema</Link>
      </div>
      <AutomationManager rules={demoAutomationRules as any} templates={demoAutomationTemplates as any} history={demoAutomationHistory as any} mode="demo" />
    </AppShell>
  );
}
