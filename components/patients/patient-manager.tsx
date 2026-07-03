"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Power, Search, X } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { OperationalKpi } from "@/components/ui/operational-kpi";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Patient } from "@/types/database";
import { patientStatusLabel } from "@/modules/patients/status";
import { Toast, useToast } from "@/components/ui/toast";

const sources = [
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Referido",
  "Visita directa",
  "Google Maps",
  "Otro",
];
const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  birth_date: "",
  source: "WhatsApp",
  notes: "",
};

type PatientForm = typeof emptyForm;
type Props = { patients: Patient[]; mode?: "app" | "demo" };

function normalizePhone(phone: string) {
  return phone.replace(/\s|\-|\(|\)/g, "").trim();
}

function toForm(patient: Patient): PatientForm {
  const nameParts = patient.full_name.split(" ");
  return {
    first_name: patient.first_name || nameParts[0] || "",
    last_name: patient.last_name || nameParts.slice(1).join(" ") || "",
    phone: patient.phone || "",
    email: patient.email || "",
    birth_date: patient.birth_date || "",
    source: patient.source || "WhatsApp",
    notes: patient.notes || "",
  };
}

export function PatientManager({ patients, mode = "app" }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [editForm, setEditForm] = useState<PatientForm>(emptyForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast, closeToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const isDemo = mode === "demo";

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return patients;
    return patients.filter((patient) =>
      `${patient.full_name} ${patient.phone} ${patient.email || ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [patients, search]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const patientMetrics = useMemo(() => {
    const active = patients.filter(
      (patient) => patient.is_active !== false,
    ).length;
    const inactive = patients.length - active;
    const inTreatment = patients.filter(
      (patient) => patient.status === "in_treatment",
    ).length;
    const withDebt = patients.filter(
      (patient) => patient.status === "recovery",
    ).length;
    return { active, inactive, inTreatment, withDebt };
  }, [patients]);

  function hasDuplicatePhone(phone: string, ignorePatientId?: string) {
    const normalized = normalizePhone(phone);
    return patients.some(
      (patient) =>
        patient.id !== ignorePatientId &&
        normalizePhone(patient.phone) === normalized,
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para crear pacientes reales.",
      );
    setSaving(true);
    try {
      const phone = form.phone.trim();
      if (hasDuplicatePhone(phone)) {
        showToast(
          "error",
          "Teléfono duplicado",
          "Ya existe un paciente registrado con ese teléfono.",
        );
        return;
      }

      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("patients").insert({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        full_name: fullName,
        phone,
        email: form.email || null,
        birth_date: form.birth_date || null,
        source: form.source,
        notes: form.notes || null,
        status: "new_lead",
        risk_level: "low",
        is_active: true,
        last_contact_at: new Date().toISOString(),
      });
      if (error) throw error;
      setForm(emptyForm);
      showToast(
        "success",
        "Paciente creado",
        "Fue enviado automáticamente al Kanban en Nuevo Lead.",
      );
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo guardar el paciente",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(patient: Patient) {
    setEditingPatient(patient);
    setEditForm(toForm(patient));
    closeToast();
  }

  async function updatePatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPatient) return;
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para editar pacientes reales.",
      );
    setSavingEdit(true);
    try {
      const phone = editForm.phone.trim();
      if (hasDuplicatePhone(phone, editingPatient.id)) {
        showToast(
          "error",
          "No se pudo guardar",
          "Ya existe otro paciente con este teléfono.",
        );
        return;
      }

      const fullName = `${editForm.first_name} ${editForm.last_name}`.trim();
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("patients")
        .update({
          first_name: editForm.first_name.trim() || null,
          last_name: editForm.last_name.trim() || null,
          full_name: fullName,
          phone,
          email: editForm.email || null,
          birth_date: editForm.birth_date || null,
          source: editForm.source,
          notes: editForm.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPatient.id);
      if (error) throw error;
      showToast(
        "success",
        "Paciente actualizado",
        "Los cambios fueron guardados correctamente.",
      );
      setEditingPatient(null);
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo actualizar el paciente",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleActive(patient: Patient) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para activar o desactivar pacientes reales.",
      );
    const nextValue = patient.is_active === false;
    closeToast();
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("patients")
        .update({ is_active: nextValue, updated_at: new Date().toISOString() })
        .eq("id", patient.id);
      if (error) throw error;
      showToast(
        nextValue ? "success" : "warning",
        nextValue ? "Paciente activado" : "Paciente desactivado",
        nextValue
          ? "El paciente vuelve a estar disponible en la operación."
          : "No aparecerá en el Kanban operativo.",
      );
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo cambiar el estado",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    }
  }

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Toast toast={toast} onClose={closeToast} />
      <form onSubmit={save} className="card p-5">
        <div className="flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          <h2 className="font-bold text-ink">Nuevo paciente</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Al crear un paciente se enviará automáticamente al Kanban en Nuevo
          Lead.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombres"
            value={form.first_name}
            onChange={(value) => setForm({ ...form, first_name: value })}
            required
          />
          <Input
            label="Apellidos"
            value={form.last_name}
            onChange={(value) => setForm({ ...form, last_name: value })}
          />
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            required
          />
          <Input
            label="Correo"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            type="email"
          />
          <Input
            label="Fecha nacimiento"
            value={form.birth_date}
            onChange={(value) => setForm({ ...form, birth_date: value })}
            type="date"
          />
          <SourceSelect
            value={form.source}
            onChange={(value) => setForm({ ...form, source: value })}
          />
          <TextArea
            label="Observaciones"
            value={form.notes}
            onChange={(value) => setForm({ ...form, notes: value })}
          />
        </div>
        <button
          disabled={saving}
          className="btn-primary mt-5 disabled:bg-slate-300"
        >
          {saving ? "Guardando..." : "Crear paciente"}
        </button>
      </form>

      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-primary" />
          <h2 className="font-bold text-ink">Buscar y editar paciente</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <OperationalKpi
            label="Total"
            value={patients.length}
            help="Pacientes"
          />
          <OperationalKpi
            label="Activos"
            value={patientMetrics.active}
            help="Operativos"
            tone="success"
          />
          <OperationalKpi
            label="En tratamiento"
            value={patientMetrics.inTreatment}
            help="Seguimiento"
            tone="primary"
          />
          <OperationalKpi
            label="Inactivos"
            value={patientMetrics.inactive}
            help="Ocultos por defecto"
          />
        </div>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nombre, teléfono o correo"
          className="mt-4"
        />
        <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {paginatedPatients.map((patient) => (
            <article
              key={patient.id}
              className={`rounded-2xl border p-4 ${patient.is_active === false ? "border-slate-200 bg-slate-50 opacity-80" : "border-slate-100 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink">{patient.full_name}</p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${patient.is_active === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {patient.is_active === false ? "Inactivo" : "Activo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {patient.phone} · {patient.source || "Sin origen"}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase text-slate-400">
                    Estado CRM: {patientStatusLabel[patient.status]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(patient)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-primary hover:text-primary"
                    aria-label="Editar paciente"
                    title="Editar paciente"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(patient)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-primary hover:text-primary"
                    aria-label={
                      patient.is_active === false
                        ? "Activar paciente"
                        : "Desactivar paciente"
                    }
                    title={
                      patient.is_active === false
                        ? "Activar paciente"
                        : "Desactivar paciente"
                    }
                  >
                    <Power size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="mt-4"
        />
      </div>

      {editingPatient ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 sm:items-center sm:justify-center sm:p-6">
          <form
            onSubmit={updatePatient}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Editar paciente
                </p>
                <h3 className="text-lg font-bold text-ink">
                  {editingPatient.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="rounded-full border border-slate-200 p-2 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombres"
                value={editForm.first_name}
                onChange={(value) =>
                  setEditForm({ ...editForm, first_name: value })
                }
                required
              />
              <Input
                label="Apellidos"
                value={editForm.last_name}
                onChange={(value) =>
                  setEditForm({ ...editForm, last_name: value })
                }
              />
              <Input
                label="Teléfono"
                value={editForm.phone}
                onChange={(value) => setEditForm({ ...editForm, phone: value })}
                required
              />
              <Input
                label="Correo"
                value={editForm.email}
                onChange={(value) => setEditForm({ ...editForm, email: value })}
                type="email"
              />
              <Input
                label="Fecha nacimiento"
                value={editForm.birth_date}
                onChange={(value) =>
                  setEditForm({ ...editForm, birth_date: value })
                }
                type="date"
              />
              <SourceSelect
                value={editForm.source}
                onChange={(value) =>
                  setEditForm({ ...editForm, source: value })
                }
              />
              <TextArea
                label="Observaciones"
                value={editForm.notes}
                onChange={(value) => setEditForm({ ...editForm, notes: value })}
              />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                disabled={savingEdit}
                className="btn-primary disabled:bg-slate-300"
              >
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-ink">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none focus:border-primary"
      />
    </label>
  );
}

function SourceSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-ink">
      Origen
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none focus:border-primary"
      >
        {sources.map((source) => (
          <option key={source}>{source}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-ink sm:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none focus:border-primary"
      />
    </label>
  );
}
