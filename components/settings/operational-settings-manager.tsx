"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Stethoscope, DoorOpen, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ConsultingRoom, Doctor } from "@/types/database";
import { Toast, useToast } from "@/components/ui/toast";
import { StatusPill } from "@/components/ui/status-pill";

type Props = {
  doctors: Doctor[];
  consultingRooms: ConsultingRoom[];
};

type DoctorForm = {
  full_name: string;
  specialty: string;
  email: string;
  phone: string;
  notes: string;
};

type RoomForm = {
  name: string;
  description: string;
  notes: string;
};

const emptyDoctor: DoctorForm = { full_name: "", specialty: "", email: "", phone: "", notes: "" };
const emptyRoom: RoomForm = { name: "", description: "", notes: "" };

export function OperationalSettingsManager({ doctors, consultingRooms }: Props) {
  const router = useRouter();
  const [doctorForm, setDoctorForm] = useState<DoctorForm>(emptyDoctor);
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoom);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingRoom, setEditingRoom] = useState<ConsultingRoom | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const activeDoctors = useMemo(() => doctors.filter((doctor) => doctor.is_active), [doctors]);
  const activeRooms = useMemo(() => consultingRooms.filter((room) => room.is_active), [consultingRooms]);

  function startEditDoctor(doctor: Doctor) {
    setEditingDoctor(doctor);
    setDoctorForm({
      full_name: doctor.full_name || "",
      specialty: doctor.specialty || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      notes: doctor.notes || ""
    });
  }

  function startEditRoom(room: ConsultingRoom) {
    setEditingRoom(room);
    setRoomForm({
      name: room.name || "",
      description: room.description || "",
      notes: room.notes || ""
    });
  }

  function resetDoctorForm() {
    setEditingDoctor(null);
    setDoctorForm(emptyDoctor);
  }

  function resetRoomForm() {
    setEditingRoom(null);
    setRoomForm(emptyRoom);
  }

  async function saveDoctor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();

    if (!doctorForm.full_name.trim()) {
      showToast("warning", "Falta el nombre", "Ingresa el nombre del doctor antes de guardar.");
      return;
    }

    try {
      setSavingDoctor(true);
      const supabase = createSupabaseBrowserClient();
      const payload = {
        full_name: doctorForm.full_name.trim(),
        specialty: doctorForm.specialty.trim() || null,
        email: doctorForm.email.trim() || null,
        phone: doctorForm.phone.trim() || null,
        notes: doctorForm.notes.trim() || null,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = editingDoctor
        ? await supabase.from("doctors").update(payload).eq("id", editingDoctor.id)
        : await supabase.from("doctors").insert(payload);

      if (error) throw error;

      showToast("success", editingDoctor ? "Doctor actualizado" : "Doctor creado", "La agenda usará doctores activos al crear citas.");
      resetDoctorForm();
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar el doctor", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSavingDoctor(false);
    }
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();

    if (!roomForm.name.trim()) {
      showToast("warning", "Falta el nombre", "Ingresa el nombre del consultorio antes de guardar.");
      return;
    }

    try {
      setSavingRoom(true);
      const supabase = createSupabaseBrowserClient();
      const payload = {
        name: roomForm.name.trim(),
        description: roomForm.description.trim() || null,
        notes: roomForm.notes.trim() || null,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = editingRoom
        ? await supabase.from("consulting_rooms").update(payload).eq("id", editingRoom.id)
        : await supabase.from("consulting_rooms").insert(payload);

      if (error) throw error;

      showToast("success", editingRoom ? "Consultorio actualizado" : "Consultorio creado", "La agenda usará consultorios activos al crear citas.");
      resetRoomForm();
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar el consultorio", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSavingRoom(false);
    }
  }

  async function toggleDoctor(doctor: Doctor) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("doctors").update({ is_active: !doctor.is_active, updated_at: new Date().toISOString() }).eq("id", doctor.id);
      if (error) throw error;
      showToast("success", doctor.is_active ? "Doctor desactivado" : "Doctor activado", "El cambio se reflejará en la agenda.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo cambiar el estado", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  }

  async function toggleRoom(room: ConsultingRoom) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("consulting_rooms").update({ is_active: !room.is_active, updated_at: new Date().toISOString() }).eq("id", room.id);
      if (error) throw error;
      showToast("success", room.is_active ? "Consultorio desactivado" : "Consultorio activado", "El cambio se reflejará en la agenda.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo cambiar el estado", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  }

  return (
    <section className="mt-6 space-y-6">
      <Toast toast={toast} onClose={closeToast} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-500">Doctores activos</p>
          <p className="mt-2 text-3xl font-black text-blue-950">{activeDoctors.length}</p>
          <p className="mt-1 text-sm text-blue-800">Disponibles para agendar citas.</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-500">Consultorios activos</p>
          <p className="mt-2 text-3xl font-black text-emerald-950">{activeRooms.length}</p>
          <p className="mt-1 text-sm text-emerald-800">Disponibles para asignación en agenda.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-primary"><Stethoscope size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-ink">Doctores</h2>
              <p className="text-sm text-muted">Administra quiénes pueden atender citas.</p>
            </div>
          </div>

          <form onSubmit={saveDoctor} className="mt-5 grid gap-3">
            <input value={doctorForm.full_name} onChange={(event) => setDoctorForm((current) => ({ ...current, full_name: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Nombre del doctor" />
            <input value={doctorForm.specialty} onChange={(event) => setDoctorForm((current) => ({ ...current, specialty: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Especialidad" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={doctorForm.email} onChange={(event) => setDoctorForm((current) => ({ ...current, email: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Correo opcional" />
              <input value={doctorForm.phone} onChange={(event) => setDoctorForm((current) => ({ ...current, phone: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Teléfono opcional" />
            </div>
            <textarea value={doctorForm.notes} onChange={(event) => setDoctorForm((current) => ({ ...current, notes: event.target.value }))} rows={2} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Notas internas" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button disabled={savingDoctor} className="btn-primary inline-flex items-center justify-center gap-2 disabled:bg-slate-300"><Plus size={16} /> {savingDoctor ? "Guardando..." : editingDoctor ? "Guardar doctor" : "Crear doctor"}</button>
              {editingDoctor ? <button type="button" onClick={resetDoctorForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-muted transition hover:bg-slate-50">Cancelar</button> : null}
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="rounded-3xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink">{doctor.full_name}</p><StatusPill label={doctor.is_active ? "Activo" : "Inactivo"} variant={doctor.is_active ? "success" : "warning"} /></div>
                    <p className="mt-1 text-sm text-muted">{doctor.specialty || "Sin especialidad"}</p>
                    <p className="mt-1 text-xs text-muted">{doctor.phone || "Sin teléfono"}{doctor.email ? ` · ${doctor.email}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => startEditDoctor(doctor)} className="rounded-2xl border border-slate-200 p-2 text-muted transition hover:border-primary/30 hover:text-primary" aria-label="Editar doctor"><Edit3 size={16} /></button>
                    <button type="button" onClick={() => toggleDoctor(doctor)} className="rounded-2xl border border-slate-200 p-2 text-muted transition hover:border-primary/30 hover:text-primary" aria-label={doctor.is_active ? "Desactivar doctor" : "Activar doctor"}><X size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><DoorOpen size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-ink">Consultorios</h2>
              <p className="text-sm text-muted">Administra espacios disponibles para la agenda.</p>
            </div>
          </div>

          <form onSubmit={saveRoom} className="mt-5 grid gap-3">
            <input value={roomForm.name} onChange={(event) => setRoomForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Nombre del consultorio" />
            <input value={roomForm.description} onChange={(event) => setRoomForm((current) => ({ ...current, description: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Descripción opcional" />
            <textarea value={roomForm.notes} onChange={(event) => setRoomForm((current) => ({ ...current, notes: event.target.value }))} rows={2} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4" placeholder="Notas internas" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button disabled={savingRoom} className="btn-primary inline-flex items-center justify-center gap-2 disabled:bg-slate-300"><Plus size={16} /> {savingRoom ? "Guardando..." : editingRoom ? "Guardar consultorio" : "Crear consultorio"}</button>
              {editingRoom ? <button type="button" onClick={resetRoomForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-muted transition hover:bg-slate-50">Cancelar</button> : null}
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {consultingRooms.map((room) => (
              <div key={room.id} className="rounded-3xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink">{room.name}</p><StatusPill label={room.is_active ? "Activo" : "Inactivo"} variant={room.is_active ? "success" : "warning"} /></div>
                    <p className="mt-1 text-sm text-muted">{room.description || "Sin descripción"}</p>
                    {room.notes ? <p className="mt-1 text-xs text-muted">{room.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => startEditRoom(room)} className="rounded-2xl border border-slate-200 p-2 text-muted transition hover:border-primary/30 hover:text-primary" aria-label="Editar consultorio"><Edit3 size={16} /></button>
                    <button type="button" onClick={() => toggleRoom(room)} className="rounded-2xl border border-slate-200 p-2 text-muted transition hover:border-primary/30 hover:text-primary" aria-label={room.is_active ? "Desactivar consultorio" : "Activar consultorio"}><X size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
