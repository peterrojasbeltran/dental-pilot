"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { countryPresets, getCountryPreset } from "@/modules/settings/country-presets";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ClinicSettings } from "@/types/database";
import { Toast, useToast } from "@/components/ui/toast";

type Props = { settings: ClinicSettings };

export function SettingsForm({ settings }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    clinic_name: settings.clinic_name || "",
    legal_name: settings.legal_name || "",
    contact_email: settings.contact_email || "",
    phone: settings.phone || "",
    address: settings.address || "",
    city: settings.city || "",
    country: settings.country || "Bolivia"
  });
  const [saving, setSaving] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const regional = useMemo(() => getCountryPreset(form.country), [form.country]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();
    setSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        ...form,
        currency_code: regional.currency_code,
        currency_symbol: regional.currency_symbol,
        timezone: regional.timezone,
        locale: regional.locale,
        tax_enabled: false
      };

      const { error } = await supabase.from("clinic_settings").update(payload).eq("id", settings.id);
      if (error) throw error;

      showToast("success", "Configuración guardada", "Los datos de la clínica fueron actualizados correctamente.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar la configuración", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 p-5">
      <Toast toast={toast} onClose={closeToast} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre de la clínica" value={form.clinic_name} onChange={(value) => updateField("clinic_name", value)} required />
        <Field label="Nombre comercial o razón social" value={form.legal_name} onChange={(value) => updateField("legal_name", value)} />
        <Field label="Correo" value={form.contact_email} onChange={(value) => updateField("contact_email", value)} type="email" />
        <Field label="Teléfono" value={form.phone} onChange={(value) => updateField("phone", value)} />
        <Field label="Dirección" value={form.address} onChange={(value) => updateField("address", value)} />
        <Field label="Ciudad" value={form.city} onChange={(value) => updateField("city", value)} />
        <label className="space-y-2 text-sm font-semibold text-ink">
          País
          <select value={form.country} onChange={(event) => updateField("country", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none ring-primary/20 focus:ring-4">
            {countryPresets.map((item) => <option key={item.country} value={item.country}>{item.country}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-900">Configuración regional automática</p>
        <p className="mt-1 text-sm text-blue-800">Al cambiar el país, Dental Pilot define moneda, símbolo, zona horaria e idioma regional para evitar errores.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Moneda" value={regional.currency_code} />
          <Info label="Símbolo" value={regional.currency_symbol} />
          <Info label="Zona horaria" value={regional.timezone} />
          <Info label="Formato local" value={regional.locale} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button disabled={saving} className="btn-primary inline-flex items-center justify-center gap-2 disabled:bg-slate-300">
          <Save size={16} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>

      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-ink">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none ring-primary/20 focus:ring-4" />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/80 p-3"><p className="text-xs font-bold uppercase text-blue-500">{label}</p><p className="mt-1 font-semibold text-ink">{value}</p></div>;
}
