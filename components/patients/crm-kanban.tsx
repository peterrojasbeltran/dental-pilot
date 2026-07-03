"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment, Budget, ClinicSettings, Patient, PatientStatus, Payment, RiskLevel, Treatment } from "@/types/database";
import { StatusPill } from "@/components/ui/status-pill";
import { Toast, useToast } from "@/components/ui/toast";
import { SearchInput } from "@/components/ui/search-input";
import { formatMoney } from "@/lib/currency";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRiskVariant, patientStatusLabel, patientStatusOrder, riskLabel } from "@/modules/patients/status";
import { PatientDetailDrawer } from "./patient-detail-drawer";

type CrmView = "all" | "sales" | "operation" | "followup";

const CRM_VIEW_LABELS: Record<CrmView, string> = {
  all: "Todos",
  sales: "Ventas",
  operation: "Operación",
  followup: "Seguimiento"
};

const CRM_VIEW_STATUSES: Record<CrmView, PatientStatus[]> = {
  all: patientStatusOrder,
  sales: ["new_lead", "contacted", "budgeted"],
  operation: ["scheduled", "attended", "in_treatment"],
  followup: ["recovery", "inactive", "finished"]
};

const DEFAULT_VISIBLE_PER_COLUMN = 8;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("failed to fetch")) {
    return "No pudimos conectar con la base de datos. Verifica tu conexión e intenta nuevamente.";
  }
  return message || "No se pudo completar la acción. Intenta nuevamente.";
}

export function CrmKanban({ patients, settings, appointments = [], treatments = [], budgets = [], payments = [], demoMode = false }: { patients: Patient[]; settings: ClinicSettings; appointments?: Appointment[]; treatments?: Treatment[]; budgets?: Budget[]; payments?: Payment[]; demoMode?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(patients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<CrmView>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [mobileStatus, setMobileStatus] = useState<PatientStatus>(patientStatusOrder[0]);
  const [savingPatientId, setSavingPatientId] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    setItems(patients);
  }, [patients]);

  useEffect(() => {
    const saved = window.localStorage.getItem("dental-pilot.crm.filters");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { view?: CrmView; riskFilter?: "all" | RiskLevel; search?: string };
      if (parsed.view && parsed.view in CRM_VIEW_LABELS) setView(parsed.view);
      if (parsed.riskFilter) setRiskFilter(parsed.riskFilter);
      if (parsed.search) setSearch(parsed.search);
    } catch {
      // Ignorar filtros antiguos corruptos.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dental-pilot.crm.filters", JSON.stringify({ view, riskFilter, search }));
  }, [view, riskFilter, search]);

  const visibleStatuses = CRM_VIEW_STATUSES[view];
  const activeItems = useMemo(() => items.filter((patient) => patient.is_active !== false), [items]);

  const filteredItems = useMemo(() => {
    const term = normalize(search.trim());
    return activeItems.filter((patient) => {
      const matchesSearch = !term || [patient.full_name, patient.phone, patient.active_treatment, patient.source, patient.next_action]
        .filter(Boolean)
        .some((value) => normalize(String(value)).includes(term));
      const matchesRisk = riskFilter === "all" || patient.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [activeItems, search, riskFilter]);

  const visibleItems = useMemo(() => filteredItems.filter((patient) => visibleStatuses.includes(patient.status)), [filteredItems, visibleStatuses]);
  const highRiskCount = filteredItems.filter((patient) => patient.risk_level === "high").length;
  const followupCount = filteredItems.filter((patient) => ["recovery", "inactive"].includes(patient.status)).length;
  const totalPipelineValue = visibleItems.reduce((total, patient) => total + Number(patient.estimated_value || 0), 0);

  async function movePatient(patientId: string, newStatus: PatientStatus) {
    const currentPatient = items.find((patient) => patient.id === patientId);
    if (!currentPatient || currentPatient.status === newStatus) return;

    const previousItems = items;
    const updatedPatient = { ...currentPatient, status: newStatus, last_contact_at: new Date().toISOString() };

    setItems((current) => current.map((patient) => (patient.id === patientId ? updatedPatient : patient)));
    if (selectedPatient?.id === patientId) setSelectedPatient(updatedPatient);
    closeToast();

    if (demoMode) {
      showToast("info", "Movimiento aplicado solo en demo", "Los datos ficticios no se guardan.");
      return;
    }

    try {
      setSavingPatientId(patientId);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("patients")
        .update({ status: newStatus, last_contact_at: new Date().toISOString() })
        .eq("id", patientId);

      if (error) throw error;

      showToast("success", "Estado actualizado", `${currentPatient.full_name} ahora está en ${patientStatusLabel[newStatus]}.`);
      router.refresh();
    } catch (error) {
      setItems(previousItems);
      if (selectedPatient?.id === patientId) setSelectedPatient(currentPatient);
      showToast("error", "No se pudo guardar el movimiento", friendlyError(error));
    } finally {
      setSavingPatientId(null);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={closeToast} />
      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">CRM Kanban</p>
            <h2 className="text-xl font-bold text-ink">Pipeline de pacientes</h2>
            <p className="max-w-3xl text-sm text-muted">Vista operativa para trabajar con pocos o muchos pacientes. Usa vistas, búsqueda y filtros para evitar columnas saturadas.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold uppercase text-slate-400">Visibles</p><p className="text-lg font-black text-ink">{visibleItems.length}</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold uppercase text-slate-400">Alto riesgo</p><p className="text-lg font-black text-ink">{highRiskCount}</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold uppercase text-slate-400">Valor</p><p className="text-lg font-black text-ink">{formatMoney(totalPipelineValue, settings)}</p></div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar paciente, teléfono, tratamiento o próxima acción"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(CRM_VIEW_LABELS) as CrmView[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setView(option);
                  const first = CRM_VIEW_STATUSES[option][0];
                  if (first) setMobileStatus(first);
                }}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition ${view === option ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary/40"}`}
              >
                {CRM_VIEW_LABELS[option]}
              </button>
            ))}
          </div>
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as "all" | RiskLevel)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            aria-label="Filtrar por riesgo"
          >
            <option value="all">Todos los riesgos</option>
            <option value="high">Riesgo alto</option>
            <option value="medium">Riesgo medio</option>
            <option value="low">Riesgo bajo</option>
          </select>
        </div>
        {followupCount > 0 ? <p className="mt-3 text-xs font-semibold text-amber-700">{followupCount} paciente(s) requieren seguimiento o recuperación.</p> : null}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 md:hidden">
        {visibleStatuses.map((status) => {
          const count = filteredItems.filter((patient) => patient.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setMobileStatus(status)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                mobileStatus === status
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {patientStatusLabel[status]} · {count}
            </button>
          );
        })}
      </div>

      <section className="mt-4 pb-4 md:mt-5 md:overflow-x-auto">
        <div className={`grid gap-4 md:min-w-[980px]`} style={{ gridTemplateColumns: `repeat(${Math.max(visibleStatuses.length, 3)}, minmax(220px, 1fr))` }}>
          {visibleStatuses.map((status) => {
            const columnPatients = filteredItems.filter((patient) => patient.status === status);
            const columnValue = columnPatients.reduce((total, patient) => total + Number(patient.estimated_value || 0), 0);
            const expanded = expandedColumns[status] === true;
            const shownPatients = expanded ? columnPatients : columnPatients.slice(0, DEFAULT_VISIBLE_PER_COLUMN);
            const hiddenCount = Math.max(0, columnPatients.length - shownPatients.length);
            return (
              <div
                key={status}
                className={`rounded-3xl border border-slate-100 bg-slate-50/80 p-3 ${status === mobileStatus ? "block" : "hidden md:block"}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const patientId = event.dataTransfer.getData("patient-id");
                  if (patientId) void movePatient(patientId, status);
                }}
              >
                <div className="sticky top-0 z-10 mb-3 rounded-2xl bg-slate-50/95 pb-2 backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-ink">{patientStatusLabel[status]}</h3>
                      <p className="text-xs text-muted">{columnPatients.length} paciente(s)</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500 shadow-sm">{formatMoney(columnValue, settings)}</span>
                  </div>
                </div>

                <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
                  {columnPatients.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-center text-xs text-slate-400">Arrastra pacientes aquí</div>
                  ) : (
                    shownPatients.map((patient) => (
                      <article
                        key={patient.id}
                        draggable={!savingPatientId}
                        onDragStart={(event) => event.dataTransfer.setData("patient-id", patient.id)}
                        className={`rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${savingPatientId === patient.id ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing"}`}
                      >
                        <button className="w-full text-left" onClick={() => setSelectedPatient(patient)}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="min-w-0 text-sm font-bold leading-tight text-ink line-clamp-2">{patient.full_name}</h4>
                            <StatusPill label={riskLabel[patient.risk_level]} variant={getRiskVariant(patient.risk_level)} />
                          </div>
                          <p className="mt-1 text-xs text-muted">{patient.phone}</p>
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                            <span className="min-w-0 truncate text-xs font-semibold text-slate-600">{patient.active_treatment || "Sin tratamiento"}</span>
                            <span className="shrink-0 text-xs font-black text-slate-700">{formatMoney(patient.estimated_value || 0, settings)}</span>
                          </div>
                        </button>
                        <div className="mt-3 md:hidden">
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Mover a</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-primary disabled:bg-slate-50"
                            value={patient.status}
                            disabled={savingPatientId === patient.id}
                            onChange={(event) => void movePatient(patient.id, event.target.value as PatientStatus)}
                          >
                            {patientStatusOrder.map((option) => (
                              <option key={option} value={option}>{patientStatusLabel[option]}</option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                  {hiddenCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpandedColumns((current) => ({ ...current, [status]: !expanded }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-blue-50"
                    >
                      {expanded ? "Ver menos" : `Mostrar ${hiddenCount} más`}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PatientDetailDrawer patient={selectedPatient} settings={settings} appointments={appointments} treatments={treatments} budgets={budgets} payments={payments} onClose={() => setSelectedPatient(null)} />
    </>
  );
}
