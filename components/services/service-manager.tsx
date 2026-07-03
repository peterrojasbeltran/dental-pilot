"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { Toast, useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ClinicSettings, Service } from "@/types/database";

const categories = ["Preventiva", "Estética", "Ortodoncia", "Endodoncia", "Cirugía", "Otros"];

const emptyForm = { id: "", name: "", description: "", category: "Preventiva", price: "", duration_minutes: "45", is_active: true };

type Props = { services: Service[]; settings: ClinicSettings; mode?: "app" | "demo" };

export function ServiceManager({ services, settings, mode = "app" }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const { toast, showToast, closeToast } = useToast();
  const [saving, setSaving] = useState(false);
  const isDemo = mode === "demo";

  function edit(service: Service) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description || "",
      category: service.category || "Preventiva",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      is_active: service.is_active
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para guardar servicios reales.");
    setSaving(true);
    closeToast();
    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        category: form.category,
        price: Number(form.price || 0),
        duration_minutes: Number(form.duration_minutes || 45),
        is_active: form.is_active
      };
      const request = form.id ? supabase.from("services").update(payload).eq("id", form.id) : supabase.from("services").insert(payload);
      const { error } = await request;
      if (error) throw error;
      setForm(emptyForm);
      showToast("success", "Servicio guardado", "La información del servicio fue actualizada correctamente.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar el servicio", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(service: Service) {
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para activar o desactivar servicios reales.");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("services").update({ is_active: !service.is_active }).eq("id", service.id);
    if (error) {
      showToast("error", "No se pudo cambiar el estado", error.message);
    } else {
      showToast(!service.is_active ? "success" : "warning", !service.is_active ? "Servicio activado" : "Servicio desactivado", !service.is_active ? "El servicio vuelve a estar disponible para agenda." : "No aparecerá como opción activa en nuevas citas.");
      router.refresh();
    }
  }

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Toast toast={toast} onClose={closeToast} />
      <form onSubmit={save} className="card p-5">
        <div className="flex items-center gap-2"><Plus size={18} className="text-primary" /><h2 className="font-bold text-ink">{form.id ? "Editar servicio" : "Nuevo servicio"}</h2></div>
        <div className="mt-5 grid gap-4">
          <Input label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <label className="space-y-2 text-sm font-semibold text-ink">Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={`Precio (${settings.currency_symbol})`} value={form.price} onChange={(value) => setForm({ ...form, price: value })} type="number" required />
            <Input label="Duración (min)" value={form.duration_minutes} onChange={(value) => setForm({ ...form, duration_minutes: value })} type="number" required />
          </div>
          <label className="space-y-2 text-sm font-semibold text-ink">Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted" /></label>
          <label className="flex items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Servicio activo</label>
        </div>
        <button disabled={saving} className="btn-primary mt-5 disabled:bg-slate-300">{saving ? "Guardando..." : "Guardar servicio"}</button>

      </form>

      <section className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="card p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">{service.category || "Sin categoría"}</p><h3 className="mt-1 font-bold text-ink">{service.name}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${service.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{service.is_active ? "Activo" : "Inactivo"}</span></div>
            <p className="mt-3 text-sm text-muted">{service.description || "Sin descripción."}</p>
            <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-2xl font-black text-ink">{formatMoney(Number(service.price), settings)}</p><p className="text-sm text-muted">{service.duration_minutes} minutos</p></div><div className="flex gap-2"><button onClick={() => edit(service)} className="rounded-2xl border border-slate-200 p-3 text-muted hover:text-primary"><Pencil size={16} /></button><button onClick={() => toggle(service)} className="rounded-2xl border border-slate-200 p-3 text-muted hover:text-primary"><Power size={16} /></button></div></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="space-y-2 text-sm font-semibold text-ink">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted" /></label>;
}
