"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, CreditCard, FileText, Search, Stethoscope, UserRound, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { hasSupabaseConfig } from "@/lib/supabase-config";
import { demoAppointments, demoBudgets, demoPatients, demoPayments, demoTreatments } from "@/lib/demo-data";
import type { Appointment, Budget, Patient, Payment, Treatment } from "@/types/database";

type SearchMode = "app" | "demo";

type SearchResult = {
  id: string;
  type: "patient" | "appointment" | "treatment" | "budget" | "payment";
  title: string;
  subtitle: string;
  href: string;
};

type SearchPayload = {
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  budgets: Budget[];
  payments: Payment[];
};

const emptyPayload: SearchPayload = {
  patients: [],
  appointments: [],
  treatments: [],
  budgets: [],
  payments: []
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesQuery(value: string, query: string) {
  return normalize(value).includes(query);
}

function formatAppointmentDate(value: string) {
  try {
    return new Date(value).toLocaleString("es-BO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

function groupLabel(type: SearchResult["type"]) {
  if (type === "patient") return "Pacientes";
  if (type === "appointment") return "Citas";
  if (type === "treatment") return "Tratamientos";
  if (type === "budget") return "Presupuestos";
  return "Pagos";
}

function resultIcon(type: SearchResult["type"]) {
  if (type === "patient") return <UserRound size={16} />;
  if (type === "appointment") return <CalendarDays size={16} />;
  if (type === "treatment") return <Stethoscope size={16} />;
  if (type === "budget") return <FileText size={16} />;
  return <CreditCard size={16} />;
}

function buildResults(payload: SearchPayload, rawQuery: string, mode: SearchMode): SearchResult[] {
  const query = normalize(rawQuery.trim());
  if (query.length < 2) return [];
  const prefix = mode === "demo" ? "/demo" : "";

  const patientResults = payload.patients
    .filter((patient) => includesQuery(`${patient.full_name} ${patient.phone} ${patient.email || ""}`, query))
    .slice(0, 6)
    .map((patient) => ({
      id: `patient-${patient.id}`,
      type: "patient" as const,
      title: patient.full_name,
      subtitle: `${patient.phone}${patient.email ? ` · ${patient.email}` : ""}`,
      href: `${prefix}/patients`
    }));

  const appointmentResults = payload.appointments
    .filter((appointment) => includesQuery(`${appointment.patients?.full_name || ""} ${appointment.patients?.phone || ""} ${appointment.services?.name || ""} ${appointment.doctor_name || ""} ${appointment.status}`, query))
    .slice(0, 6)
    .map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment" as const,
      title: appointment.patients?.full_name || "Cita sin paciente",
      subtitle: `${formatAppointmentDate(appointment.starts_at)} · ${appointment.services?.name || "Servicio sin asignar"}`,
      href: `${prefix}/appointments`
    }));

  const treatmentResults = payload.treatments
    .filter((treatment) => includesQuery(`${treatment.title} ${treatment.patients?.full_name || ""} ${treatment.patients?.phone || ""} ${treatment.status}`, query))
    .slice(0, 6)
    .map((treatment) => ({
      id: `treatment-${treatment.id}`,
      type: "treatment" as const,
      title: treatment.title,
      subtitle: `${treatment.patients?.full_name || "Paciente sin asignar"} · ${treatment.status}`,
      href: `${prefix}/treatments`
    }));

  const budgetResults = payload.budgets
    .filter((budget) => includesQuery(`${budget.id} ${budget.patients?.full_name || ""} ${budget.patients?.phone || ""} ${budget.treatments?.title || ""} ${budget.status}`, query))
    .slice(0, 6)
    .map((budget) => ({
      id: `budget-${budget.id}`,
      type: "budget" as const,
      title: `Presupuesto ${budget.id.slice(0, 8)}`,
      subtitle: `${budget.patients?.full_name || "Paciente sin asignar"} · ${budget.status}`,
      href: `${prefix}/treatments`
    }));

  const paymentResults = payload.payments
    .filter((payment) => includesQuery(`${payment.id} ${payment.patients?.full_name || ""} ${payment.patients?.phone || ""} ${payment.treatments?.title || ""} ${payment.method} ${payment.status}`, query))
    .slice(0, 6)
    .map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: `Pago ${payment.id.slice(0, 8)}`,
      subtitle: `${payment.patients?.full_name || "Paciente sin asignar"} · ${payment.method}`,
      href: `${prefix}/payments`
    }));

  return [...patientResults, ...appointmentResults, ...treatmentResults, ...budgetResults, ...paymentResults].slice(0, 20);
}

async function loadAppPayload(): Promise<SearchPayload> {
  if (!hasSupabaseConfig()) {
    return {
      patients: demoPatients,
      appointments: demoAppointments,
      treatments: demoTreatments,
      budgets: demoBudgets,
      payments: demoPayments
    };
  }

  const supabase = createSupabaseBrowserClient();
  const [patients, appointments, treatments, budgets, payments] = await Promise.all([
    supabase.from("patients").select("*").limit(120),
    supabase.from("appointments").select("id, patient_id, service_id, starts_at, ends_at, status, notes, doctor_name, room_name, patients(full_name, phone), services(name, price, duration_minutes)").limit(120),
    supabase.from("treatments").select("id, patient_id, title, notes, status, total_amount, start_date, estimated_end_date, created_at, patients(full_name, phone, status)").limit(120),
    supabase.from("budgets").select("id, treatment_id, patient_id, status, subtotal_amount, discount_amount, total_amount, paid_amount, payment_status, created_at, expires_at, patients(full_name, phone), treatments(title, status)").limit(120),
    supabase.from("payments").select("id, budget_id, patient_id, treatment_id, amount, method, status, paid_at, notes, created_at, patients(full_name, phone), budgets(id, total_amount, paid_amount, payment_status, status), treatments(title, status)").limit(120)
  ]);

  return {
    patients: (patients.data || []) as Patient[],
    appointments: (appointments.data || []) as unknown as Appointment[],
    treatments: (treatments.data || []) as unknown as Treatment[],
    budgets: (budgets.data || []) as unknown as Budget[],
    payments: (payments.data || []) as unknown as Payment[]
  };
}

export function GlobalSearch({ mode = "app" }: { mode?: SearchMode }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<SearchPayload>(mode === "demo" ? {
    patients: demoPatients,
    appointments: demoAppointments,
    treatments: demoTreatments,
    budgets: demoBudgets,
    payments: demoPayments
  } : emptyPayload);
  const [loading, setLoading] = useState(mode === "app");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "demo") return;
    let mounted = true;
    setLoading(true);
    loadAppPayload()
      .then((data) => { if (mounted) setPayload(data); })
      .catch(() => { if (mounted) setPayload(emptyPayload); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [mode]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => buildResults(payload, query, mode), [payload, query, mode]);
  const groupedResults = useMemo(() => {
    return results.reduce<Record<SearchResult["type"], SearchResult[]>>((groups, result) => {
      groups[result.type] = [...(groups[result.type] || []), result];
      return groups;
    }, { patient: [], appointment: [], treatment: [], budget: [], payment: [] });
  }, [results]);

  return (
    <div ref={wrapperRef} className="relative hidden flex-1 sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none ring-primary/20 transition focus:ring-4"
        placeholder="Buscar paciente, cita, tratamiento o presupuesto..."
      />
      {query ? (
        <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label="Limpiar búsqueda">
          <X size={16} />
        </button>
      ) : null}

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
          {loading ? <p className="px-3 py-4 text-sm text-muted">Cargando búsqueda...</p> : null}
          {!loading && results.length === 0 ? <p className="px-3 py-4 text-sm text-muted">No encontramos resultados para “{query}”.</p> : null}
          {!loading && results.length > 0 ? (
            <div className="space-y-3">
              {(["patient", "appointment", "treatment", "budget", "payment"] as SearchResult["type"][]).map((type) => groupedResults[type]?.length ? (
                <div key={type}>
                  <p className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-400">{groupLabel(type)} ({groupedResults[type].length})</p>
                  <div className="space-y-1">
                    {groupedResults[type].map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-2xl px-3 py-3 text-sm transition hover:bg-slate-50"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">{resultIcon(result.type)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{result.title}</span>
                          <span className="block truncate text-xs text-muted">{result.subtitle}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
