"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarClock, Cake, Clock3, MessageCircle, RotateCcw, Save, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { Toast, useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AutomationHistory, AutomationKind, AutomationRule, AutomationTemplate } from "@/types/database";

type Props = {
  rules: AutomationRule[];
  templates: AutomationTemplate[];
  history: AutomationHistory[];
  mode?: "app" | "demo";
};

const kindLabels: Record<AutomationKind, string> = {
  appointment_reminder: "Recordatorio de cita",
  budget_followup: "Seguimiento de presupuesto",
  patient_recovery: "Recuperación de pacientes",
  birthday: "Cumpleaños"
};

const kindDescriptions: Record<AutomationKind, string> = {
  appointment_reminder: "Reduce inasistencias enviando recordatorios antes de la cita.",
  budget_followup: "Da seguimiento a presupuestos enviados que todavía no fueron aprobados.",
  patient_recovery: "Reactiva pacientes sin actividad reciente o controles pendientes.",
  birthday: "Mantiene una relación cercana con mensajes de cumpleaños."
};

function getKindIcon(kind: AutomationKind) {
  if (kind === "appointment_reminder") return CalendarClock;
  if (kind === "budget_followup") return Send;
  if (kind === "patient_recovery") return RotateCcw;
  return Cake;
}

function statusLabel(status: AutomationHistory["status"]) {
  const labels: Record<AutomationHistory["status"], string> = {
    scheduled: "Programado",
    simulated: "Simulado",
    sent: "Enviado",
    failed: "Falló"
  };
  return labels[status] || status;
}

export function AutomationManager({ rules, templates, history, mode = "app" }: Props) {
  const router = useRouter();
  const isDemo = mode === "demo";
  const { toast, showToast, closeToast } = useToast();
  const [selectedKind, setSelectedKind] = useState<AutomationKind>(rules[0]?.kind || "appointment_reminder");
  const selectedTemplate = templates.find((template) => template.kind === selectedKind);
  const [draftBody, setDraftBody] = useState(selectedTemplate?.body || "");

  const enabledCount = useMemo(() => rules.filter((rule) => rule.is_enabled).length, [rules]);
  const upcomingHistory = history.filter((item) => ["scheduled", "simulated"].includes(item.status)).slice(0, 6);

  function selectTemplate(kind: AutomationKind) {
    setSelectedKind(kind);
    const template = templates.find((item) => item.kind === kind);
    setDraftBody(template?.body || "");
  }

  async function toggleRule(rule: AutomationRule) {
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para activar o desactivar automatizaciones reales.");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("automation_rules").update({ is_enabled: !rule.is_enabled, updated_at: new Date().toISOString() }).eq("id", rule.id);
      if (error) throw error;
      showToast(!rule.is_enabled ? "success" : "warning", !rule.is_enabled ? "Automatización activada" : "Automatización desactivada", rule.title);
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo actualizar", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para editar plantillas reales.");
    if (!selectedTemplate) return;
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("automation_templates").update({ body: draftBody, updated_at: new Date().toISOString() }).eq("id", selectedTemplate.id);
      if (error) throw error;
      showToast("success", "Plantilla guardada", "El mensaje quedó preparado para futuras automatizaciones.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Toast toast={toast} onClose={closeToast} />

      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm font-semibold text-muted">Automatizaciones activas</p>
            <p className="mt-2 text-3xl font-black text-ink">{enabledCount}</p>
            <p className="mt-2 text-xs text-muted">Reglas encendidas para operación diaria.</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-muted">Próximas ejecuciones</p>
            <p className="mt-2 text-3xl font-black text-ink">{upcomingHistory.length}</p>
            <p className="mt-2 text-xs text-muted">Simuladas hasta integrar WhatsApp.</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-muted">Canal</p>
            <p className="mt-2 text-2xl font-black text-ink">Simulado</p>
            <p className="mt-2 text-xs text-muted">Listo para WhatsApp Cloud API.</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <BellRing size={20} className="text-primary" />
            <div>
              <h2 className="font-bold text-ink">Reglas de automatización</h2>
              <p className="text-sm text-muted">Activa o desactiva los flujos que usará la clínica.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {rules.map((rule) => {
              const Icon = getKindIcon(rule.kind);
              return (
                <article key={rule.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary"><Icon size={20} /></div>
                      <div>
                        <h3 className="font-bold text-ink">{rule.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted">{rule.description || kindDescriptions[rule.kind]}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleRule(rule)} className={`rounded-2xl border p-2 transition ${rule.is_enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`} aria-label={rule.is_enabled ? "Desactivar" : "Activar"}>
                      {rule.is_enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-3 py-1 ${rule.is_enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{rule.is_enabled ? "Activa" : "Inactiva"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{rule.trigger_label}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <form onSubmit={saveTemplate} className="card p-5">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            <div>
              <h2 className="font-bold text-ink">Plantillas de mensaje</h2>
              <p className="text-sm text-muted">Mensajes preparados. El envío real llegará con WhatsApp.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {rules.map((rule) => (
              <button key={rule.kind} type="button" onClick={() => selectTemplate(rule.kind)} className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${selectedKind === rule.kind ? "bg-primary text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{kindLabels[rule.kind]}</button>
            ))}
          </div>
          <label className="mt-4 block space-y-2 text-sm font-semibold text-ink">
            Mensaje
            <textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={8} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-muted" />
          </label>
          <p className="mt-3 text-xs leading-5 text-muted">Variables disponibles: {selectedTemplate?.variables?.map((item) => `{{${item}}}`).join(", ") || "sin variables"}</p>
          <button className="btn-primary mt-4 inline-flex items-center gap-2" type="submit"><Save size={16} /> Guardar plantilla</button>
        </form>

        <section className="card p-5">
          <div className="flex items-center gap-2">
            <Clock3 size={20} className="text-primary" />
            <div>
              <h2 className="font-bold text-ink">Próximas automatizaciones</h2>
              <p className="text-sm text-muted">Vista simulada antes de conectar WhatsApp.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingHistory.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{item.patient_name}</p>
                    <p className="mt-1 text-xs text-muted">{kindLabels[item.kind]} · {item.target_label}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{statusLabel(item.status)}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{item.message_preview}</p>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
