"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, Edit3, Plus, Search, UserRound, X } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency } from "@/lib/currency";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Appointment, ClinicSettings, ConsultingRoom, Doctor, Patient, PatientStatus, Service } from "@/types/database";

type AppointmentWorkspaceProps = {
  appointments: Appointment[];
  patients: Patient[];
  services: Service[];
  settings: ClinicSettings;
  doctors?: Doctor[];
  consultingRooms?: ConsultingRoom[];
  mode?: "app" | "demo";
};

type ViewMode = "day" | "week" | "doctor";
type StatusFilter = "all" | "attention" | "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
type ToastType = "success" | "error" | "warning" | "info";
type ToastState = { type: ToastType; title: string; description?: string } | null;

type DecoratedAppointment = Appointment & {
  doctor_name?: string;
  room_name?: string;
};

const fallbackDoctors = ["Dra. Camila Rojas", "Dr. Andrés Méndez", "Dra. Valeria Paz"];
const fallbackRooms = ["Consultorio 1", "Consultorio 2", "Consultorio 3"];
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  scheduled: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En curso",
  completed: "Finalizada",
  cancelled: "Cancelada",
  no_show: "No asistió"
};

const crmStatusByAppointmentStatus: Record<string, PatientStatus> = {
  pending: "scheduled",
  scheduled: "scheduled",
  confirmed: "scheduled",
  in_progress: "attended",
  completed: "attended",
  cancelled: "recovery",
  no_show: "recovery"
};

function statusVariant(status: string): "success" | "warning" | "danger" {
  if (["confirmed", "completed", "in_progress"].includes(status)) return "success";
  if (["cancelled", "no_show"].includes(status)) return "danger";
  return "warning";
}

function formatHour(value: string, locale: string) {
  return new Date(value).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function formatDay(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short" });
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function addMinutes(isoDate: string, minutes: number) {
  return new Date(new Date(isoDate).getTime() + minutes * 60 * 1000).toISOString();
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function AppointmentWorkspace({ appointments, patients, services, settings, doctors = [], consultingRooms = [], mode = "app" }: AppointmentWorkspaceProps) {
  const router = useRouter();
  const doctorOptions = doctors.filter((doctor) => doctor.is_active).map((doctor) => doctor.full_name);
  const roomOptions = consultingRooms.filter((room) => room.is_active).map((room) => room.name);
  const availableDoctors = doctorOptions.length ? doctorOptions : fallbackDoctors;
  const availableRooms = roomOptions.length ? roomOptions : fallbackRooms;

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().slice(0, 10));
  const activePatients = patients.filter((patient) => patient.is_active !== false);
  const [selectedPatientId, setSelectedPatientId] = useState(activePatients[0]?.id || patients[0]?.id || "");
  const [patientSearch, setPatientSearch] = useState("");
  const activeServices = services.filter((service) => service.is_active);
  const [selectedServiceId, setSelectedServiceId] = useState(activeServices[0]?.id || services[0]?.id || "");
  const [selectedDoctor, setSelectedDoctor] = useState(availableDoctors[0]);
  const [selectedRoom, setSelectedRoom] = useState(availableRooms[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [editingAppointment, setEditingAppointment] = useState<DecoratedAppointment | null>(null);
  const [editPatientId, setEditPatientId] = useState("");
  const [editPatientSearch, setEditPatientSearch] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editDoctor, setEditDoctor] = useState(availableDoctors[0]);
  const [editRoom, setEditRoom] = useState(availableRooms[0]);
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editTime, setEditTime] = useState("09:00");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isDemo = mode === "demo";

  function showToast(type: ToastType, title: string, description?: string) {
    setToast({ type, title, description });
    window.setTimeout(() => setToast(null), 4500);
  }

  const decoratedAppointments = useMemo<DecoratedAppointment[]>(
    () =>
      appointments.map((appointment, index) => ({
        ...appointment,
        doctor_name: appointment.doctor_name || availableDoctors[index % availableDoctors.length],
        room_name: appointment.room_name || availableRooms[index % availableRooms.length]
      })),
    [appointments, availableDoctors, availableRooms]
  );

  const selectedDayStart = new Date(`${agendaDate}T00:00:00`).getTime();
  const selectedDayEnd = new Date(`${agendaDate}T23:59:59`).getTime();
  const weekEnd = selectedDayStart + 7 * 24 * 60 * 60 * 1000;
  const attentionStatuses = ["pending", "scheduled"];
  const today = new Date().toISOString().slice(0, 10);

  const attentionAppointments = decoratedAppointments
    .filter((appointment) => attentionStatuses.includes(appointment.status))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const filteredAppointments = decoratedAppointments
    .filter((appointment) => {
      if (selectedStatus === "all") return true;
      if (selectedStatus === "attention") return attentionStatuses.includes(appointment.status);
      return appointment.status === selectedStatus;
    })
    .filter((appointment) => {
      if (selectedStatus === "attention") return true;
      const appointmentTime = new Date(appointment.starts_at).getTime();
      if (viewMode === "day") return appointmentTime >= selectedDayStart && appointmentTime <= selectedDayEnd;
      if (viewMode === "week") return appointmentTime >= selectedDayStart && appointmentTime < weekEnd;
      return true;
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const groupedByDoctor = availableDoctors.map((doctor) => ({
    doctor,
    appointments: filteredAppointments.filter((appointment) => appointment.doctor_name === doctor)
  }));

  const confirmedCount = decoratedAppointments.filter((item) => item.status === "confirmed").length;
  const pendingCount = attentionAppointments.length;
  const filteredPatients = useMemo(() => {
    const query = normalizeText(patientSearch.trim());
    if (!query) return activePatients.slice(0, 8);
    return activePatients
      .filter((patient) => normalizeText(`${patient.full_name} ${patient.phone} ${patient.email || ""}`).includes(query))
      .slice(0, 8);
  }, [activePatients, patientSearch]);

  const filteredEditPatients = useMemo(() => {
    const query = normalizeText(editPatientSearch.trim());
    if (!query) return activePatients.slice(0, 8);
    return activePatients
      .filter((patient) => normalizeText(`${patient.full_name} ${patient.phone} ${patient.email || ""}`).includes(query))
      .slice(0, 8);
  }, [activePatients, editPatientSearch]);

  const selectedPatient = activePatients.find((item) => item.id === selectedPatientId) || patients.find((item) => item.id === selectedPatientId);
  const selectedService = services.find((item) => item.id === selectedServiceId);
  const crmStatusLabels: Record<string, string> = {
    new_lead: "Nuevo lead",
    contacted: "Contactado",
    scheduled: "Agendado",
    attended: "Asistió",
    in_treatment: "En tratamiento",
    inactive: "Inactivo",
    recovery: "Recuperación",
    finished: "Finalizado"
  };
  const selectedCrmStatusLabel = selectedPatient?.status ? (crmStatusLabels[selectedPatient.status] || selectedPatient.status) : "Sin estado";
  const potentialRevenue = decoratedAppointments.reduce((total, item) => total + Number(item.services?.price || 0), 0);

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);

    if (isDemo) {
      showToast("info", "Demo en solo lectura", "Ingresa al sistema para guardar una cita real.");
      return;
    }

    if (!selectedPatientId || !selectedServiceId || !selectedDate || !selectedTime) {
      showToast("warning", "Faltan datos", "Completa paciente, servicio, fecha y hora antes de guardar.");
      return;
    }

    const service = services.find((item) => item.id === selectedServiceId);
    const startsAt = buildDateTime(selectedDate, selectedTime);
    const endsAt = addMinutes(startsAt, service?.duration_minutes || 45);

    try {
      setIsSaving(true);
      const supabase = createSupabaseBrowserClient();

      const [{ data: doctorConflicts, error: doctorConflictError }, { data: patientConflicts, error: patientConflictError }] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, status, starts_at, ends_at, doctor_name")
          .eq("doctor_name", selectedDoctor)
          .neq("status", "cancelled")
          .lt("starts_at", endsAt)
          .gt("ends_at", startsAt)
          .limit(1),
        supabase
          .from("appointments")
          .select("id, status, starts_at, ends_at, patient_id")
          .eq("patient_id", selectedPatientId)
          .neq("status", "cancelled")
          .lt("starts_at", endsAt)
          .gt("ends_at", startsAt)
          .limit(1)
      ]);

      if (doctorConflictError) throw doctorConflictError;
      if (patientConflictError) throw patientConflictError;

      if (doctorConflicts?.length) {
        showToast("error", "Horario no disponible", "Ese doctor ya tiene una cita que cruza con el horario seleccionado.");
        return;
      }

      if (patientConflicts?.length) {
        showToast("error", "Paciente no disponible", "Este paciente ya tiene una cita que cruza con el horario seleccionado, aunque sea con otro doctor.");
        return;
      }

      const { error } = await supabase.from("appointments").insert({
        patient_id: selectedPatientId,
        service_id: selectedServiceId,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "scheduled",
        doctor_name: selectedDoctor,
        room_name: selectedRoom,
        notes: notes || null
      });

      if (error) throw error;

      await supabase
        .from("patients")
        .update({ status: "scheduled", last_contact_at: new Date().toISOString() })
        .eq("id", selectedPatientId);

      setNotes("");
      showToast("success", "Cita creada correctamente", "La agenda y el CRM fueron actualizados.");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la cita.";
      showToast("error", "No se pudo guardar la cita", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(appointment: DecoratedAppointment, nextStatus: string) {
    if (isDemo) return;

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("appointments").update({ status: nextStatus }).eq("id", appointment.id);
      if (error) throw error;

      if (appointment.patient_id && crmStatusByAppointmentStatus[nextStatus]) {
        await supabase.from("patients").update({ status: crmStatusByAppointmentStatus[nextStatus] }).eq("id", appointment.patient_id);
      }

      showToast("success", "Estado actualizado", "La cita y el estado del paciente fueron actualizados.");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      showToast("error", "No se pudo actualizar el estado", errorMessage);
    }
  }

  function canEditAppointment(status: string) {
    return ["pending", "scheduled", "confirmed"].includes(status);
  }

  function openEditAppointment(appointment: DecoratedAppointment) {
    if (!canEditAppointment(appointment.status)) {
      showToast("warning", "Cita no editable", "Solo puedes editar citas pendientes o confirmadas.");
      return;
    }

    const start = new Date(appointment.starts_at);
    setEditingAppointment(appointment);
    setEditPatientId(appointment.patient_id || "");
    setEditPatientSearch(appointment.patients?.full_name || "");
    setEditServiceId(appointment.service_id || activeServices[0]?.id || services[0]?.id || "");
    setEditDoctor(appointment.doctor_name || availableDoctors[0]);
    setEditRoom(appointment.room_name || availableRooms[0]);
    setEditDate(start.toISOString().slice(0, 10));
    setEditTime(start.toISOString().slice(11, 16));
    setEditNotes(appointment.notes || "");
  }

  async function handleUpdateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAppointment || isDemo) return;

    if (!editPatientId || !editServiceId || !editDate || !editTime) {
      showToast("warning", "Faltan datos", "Completa paciente, servicio, fecha y hora antes de guardar.");
      return;
    }

    const service = services.find((item) => item.id === editServiceId);
    const startsAt = buildDateTime(editDate, editTime);
    const endsAt = addMinutes(startsAt, service?.duration_minutes || 45);

    try {
      setIsUpdating(true);
      const supabase = createSupabaseBrowserClient();

      const [{ data: doctorConflicts, error: doctorConflictError }, { data: patientConflicts, error: patientConflictError }] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, status, starts_at, ends_at, doctor_name")
          .eq("doctor_name", editDoctor)
          .neq("id", editingAppointment.id)
          .neq("status", "cancelled")
          .lt("starts_at", endsAt)
          .gt("ends_at", startsAt)
          .limit(1),
        supabase
          .from("appointments")
          .select("id, status, starts_at, ends_at, patient_id")
          .eq("patient_id", editPatientId)
          .neq("id", editingAppointment.id)
          .neq("status", "cancelled")
          .lt("starts_at", endsAt)
          .gt("ends_at", startsAt)
          .limit(1)
      ]);

      if (doctorConflictError) throw doctorConflictError;
      if (patientConflictError) throw patientConflictError;

      if (doctorConflicts?.length) {
        showToast("error", "Horario no disponible", "Ese doctor ya tiene una cita que cruza con el horario seleccionado.");
        return;
      }

      if (patientConflicts?.length) {
        showToast("error", "Paciente no disponible", "Este paciente ya tiene una cita que cruza con el horario seleccionado, aunque sea con otro doctor.");
        return;
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          patient_id: editPatientId,
          service_id: editServiceId,
          starts_at: startsAt,
          ends_at: endsAt,
          doctor_name: editDoctor,
          room_name: editRoom,
          notes: editNotes || null
        })
        .eq("id", editingAppointment.id);

      if (error) throw error;

      await supabase
        .from("patients")
        .update({ status: "scheduled", last_contact_at: new Date().toISOString() })
        .eq("id", editPatientId);

      setEditingAppointment(null);
      showToast("success", "Cita actualizada correctamente", "Se guardaron los cambios y se validaron cruces de agenda.");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar la cita.";
      showToast("error", "No se pudo actualizar la cita", errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {editingAppointment ? (
        <EditAppointmentModal
          appointment={editingAppointment}
          settings={settings}
          services={activeServices}
          patients={filteredEditPatients}
          selectedPatientId={editPatientId}
          patientSearch={editPatientSearch}
          selectedServiceId={editServiceId}
          selectedDoctor={editDoctor}
          selectedRoom={editRoom}
          selectedDate={editDate}
          selectedTime={editTime}
          notes={editNotes}
          isUpdating={isUpdating}
          onPatientSearch={setEditPatientSearch}
          onPatientSelect={(patient) => {
            setEditPatientId(patient.id);
            setEditPatientSearch(patient.full_name);
          }}
          onServiceChange={setEditServiceId}
          doctors={availableDoctors}
          rooms={availableRooms}
          onDoctorChange={setEditDoctor}
          onRoomChange={setEditRoom}
          onDateChange={setEditDate}
          onTimeChange={setEditTime}
          onNotesChange={setEditNotes}
          onClose={() => setEditingAppointment(null)}
          onSubmit={handleUpdateAppointment}
        />
      ) : null}

      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Agenda operativa</p>
            <h1 className="mt-2 text-2xl font-black text-ink">Gestiona citas sin cruces ni duplicados</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">La agenda muestra cuándo viene el paciente. El CRM muestra en qué etapa está su seguimiento. Al crear o cambiar una cita, el sistema mantiene ambos estados conectados.</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Total</b><br /><span className="text-muted">{decoratedAppointments.length} cita(s)</span></div>
            <div className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Confirmadas</b><br /><span className="text-muted">{confirmedCount}</span></div>
            <div className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Potencial</b><br /><span className="text-muted">{formatCurrency(potentialRevenue, settings)}</span></div>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Agenda inteligente</h2>
            <p className="text-sm text-muted">Organiza el día de atención, detecta citas pendientes y conecta la agenda con el seguimiento comercial.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setAgendaDate(today); setViewMode("day"); setSelectedStatus("all"); }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => { setAgendaDate(today); setViewMode("week"); setSelectedStatus("all"); }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => { setSelectedStatus("attention"); setViewMode("week"); }}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Requieren atención ({pendingCount})
              </button>
            </div>
            <div className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm">
              {[
                { key: "day", label: "Día" },
                { key: "week", label: "Semana" },
                { key: "doctor", label: "Doctor" }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setViewMode(item.key as ViewMode)}
                  className={`rounded-xl px-3 py-2 font-semibold transition ${viewMode === item.key ? "bg-white text-ink shadow-soft" : "text-muted"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={agendaDate}
              onChange={(event) => setAgendaDate(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none ring-primary/20 focus:ring-4"
            />
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none ring-primary/20 focus:ring-4"
            >
              <option value="all">Todos los estados</option>
              <option value="attention">Requieren atención</option>
              <option value="scheduled">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="in_progress">En curso</option>
              <option value="completed">Finalizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No asistió</option>
            </select>
          </div>
        </div>

        {viewMode === "doctor" ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {groupedByDoctor.map((group) => (
              <div key={group.doctor} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <UserRound size={18} className="text-primary" />
                  <p className="font-bold text-ink">{group.doctor}</p>
                </div>
                <div className="space-y-3">
                  {group.appointments.length ? group.appointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} settings={settings} mode={mode} onStatusChange={handleStatusChange} onEdit={openEditAppointment} />
                  )) : <p className="rounded-2xl bg-white p-4 text-sm text-muted">Sin citas en esta vista.</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {filteredAppointments.length ? filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} settings={settings} showDay={viewMode === "week"} mode={mode} onStatusChange={handleStatusChange} onEdit={openEditAppointment} />
            )) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted">
                No hay citas para los filtros seleccionados. Cambia la fecha, el estado o crea una nueva cita.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <form onSubmit={handleCreateAppointment} className="card p-5">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-ink">Nueva cita</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            {isDemo ? "En la demo puedes revisar cómo se vería el formulario. No guarda datos reales." : "Registra una cita real y actualiza automáticamente el estado comercial del paciente."}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm font-semibold text-ink">
              <div className="flex items-center justify-between gap-2">
                <span>Paciente</span>
                {selectedPatient ? <span className="truncate text-xs font-medium text-muted">Seleccionado: {selectedPatient.full_name}</span> : null}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    disabled={isDemo || isSaving}
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Buscar por nombre, teléfono o correo"
                    className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredPatients.length ? filteredPatients.map((patient) => {
                    const isSelected = patient.id === selectedPatientId;
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        disabled={isDemo || isSaving}
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setPatientSearch(patient.full_name);
                        }}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${isSelected ? "border-primary bg-blue-50" : "border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50"}`}
                      >
                        <span className="block text-sm font-bold text-ink">{patient.full_name}</span>
                        <span className="mt-1 block text-xs font-medium text-muted">{patient.phone || "Sin teléfono"}{patient.email ? ` · ${patient.email}` : ""}</span>
                      </button>
                    );
                  }) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-xs font-medium text-muted">
                      No encontramos pacientes con esa búsqueda.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Servicio
              <select disabled={isDemo || isSaving} value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
                {activeServices.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min · {formatCurrency(Number(service.price), settings)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Doctor
              <select disabled={isDemo || isSaving} value={selectedDoctor} onChange={(event) => setSelectedDoctor(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
                {availableDoctors.map((doctor) => <option key={doctor} value={doctor}>{doctor}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Consultorio
              <select disabled={isDemo || isSaving} value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
                {availableRooms.map((room) => <option key={room} value={room}>{room}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Fecha
              <input disabled={isDemo || isSaving} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Hora
              <input disabled={isDemo || isSaving} type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-ink md:col-span-2">
              Nota interna
              <textarea disabled={isDemo || isSaving} value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none ring-primary/20 focus:ring-4 disabled:bg-slate-50" placeholder="Ej. paciente solicita horario puntual, confirmar por WhatsApp..." />
            </label>
          </div>
          {!isDemo ? (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <b>Antes de guardar:</b> se validará que el doctor y el paciente no tengan otra cita en la misma fecha y hora. Al crearla, el CRM del paciente pasará a <b>Agendado</b>.
              <div className="mt-2 text-xs text-blue-700">Paciente seleccionado: {selectedPatient?.full_name || "Sin paciente"} · Estado actual: {selectedCrmStatusLabel} · Servicio: {selectedService?.name || "Sin servicio"}</div>
            </div>
          ) : null}
          <button disabled={isDemo || isSaving} className="mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primaryHover disabled:cursor-not-allowed disabled:bg-slate-300">
            {isDemo ? "Solo lectura en demo" : isSaving ? "Guardando cita..." : "Crear cita"}
          </button>
        </form>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-ink">Conexión con CRM</h2>
          </div>
          <p className="mt-2 text-sm text-muted">La agenda indica cuándo viene el paciente. El CRM indica en qué etapa está dentro del seguimiento.</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><b>Agenda:</b><br />fecha, hora, doctor, servicio y estado de la cita.</div>
            <div className="rounded-2xl bg-slate-50 p-4"><b>CRM:</b><br />avance del paciente: lead, agendado, asistió, tratamiento o recuperación.</div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4"><b>Cita creada o confirmada:</b> el paciente pasa a Agendado.</div>
            <div className="rounded-2xl bg-slate-50 p-4"><b>En curso o finalizada:</b> el paciente pasa a Asistió.</div>
            <div className="rounded-2xl bg-slate-50 p-4"><b>Cancelada o no asistió:</b> el paciente entra en Recuperación.</div>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedStatus("attention"); setViewMode("week"); }}
            className="mt-4 w-full rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left text-sm text-amber-700 transition hover:bg-amber-100"
          >
            <b>{pendingCount} cita(s) requieren confirmación o seguimiento.</b>
            <span className="mt-1 block text-xs">Haz clic para verlas directamente, sin depender del filtro de fecha.</span>
          </button>
        </div>
      </section>
    </div>
  );
}



function EditAppointmentModal({
  appointment,
  settings,
  services,
  patients,
  selectedPatientId,
  patientSearch,
  selectedServiceId,
  selectedDoctor,
  selectedRoom,
  selectedDate,
  selectedTime,
  notes,
  isUpdating,
  onPatientSearch,
  onPatientSelect,
  onServiceChange,
  doctors,
  rooms,
  onDoctorChange,
  onRoomChange,
  onDateChange,
  onTimeChange,
  onNotesChange,
  onClose,
  onSubmit
}: {
  appointment: DecoratedAppointment;
  settings: ClinicSettings;
  services: Service[];
  patients: Patient[];
  selectedPatientId: string;
  patientSearch: string;
  selectedServiceId: string;
  selectedDoctor: string;
  selectedRoom: string;
  selectedDate: string;
  selectedTime: string;
  notes: string;
  isUpdating: boolean;
  onPatientSearch: (value: string) => void;
  onPatientSelect: (patient: Patient) => void;
  onServiceChange: (value: string) => void;
  doctors: string[];
  rooms: string[];
  onDoctorChange: (value: string) => void;
  onRoomChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-soft sm:max-w-4xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Editar cita</p>
            <h2 className="mt-1 text-xl font-black text-ink">Actualizar agenda del paciente</h2>
            <p className="mt-2 text-sm text-muted">Solo se pueden editar citas pendientes o confirmadas. Al guardar se validan cruces de doctor y paciente.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted transition hover:bg-slate-100" aria-label="Cerrar edición">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm font-semibold text-ink md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span>Paciente</span>
              {selectedPatient ? <span className="truncate text-xs font-medium text-muted">Seleccionado: {selectedPatient.full_name}</span> : null}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  disabled={isUpdating}
                  value={patientSearch}
                  onChange={(event) => onPatientSearch(event.target.value)}
                  placeholder="Buscar por nombre, teléfono o correo"
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {patients.length ? patients.map((patient) => {
                  const isSelected = patient.id === selectedPatientId;
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onPatientSelect(patient)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${isSelected ? "border-primary bg-blue-50" : "border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50"}`}
                    >
                      <span className="block text-sm font-bold text-ink">{patient.full_name}</span>
                      <span className="mt-1 block text-xs font-medium text-muted">{patient.phone || "Sin teléfono"}{patient.email ? ` · ${patient.email}` : ""}</span>
                    </button>
                  );
                }) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-xs font-medium text-muted">No encontramos pacientes con esa búsqueda.</div>
                )}
              </div>
            </div>
          </div>

          <label className="space-y-2 text-sm font-semibold text-ink">
            Servicio
            <select disabled={isUpdating} value={selectedServiceId} onChange={(event) => onServiceChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
              {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min · {formatCurrency(Number(service.price), settings)}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-ink">
            Doctor
            <select disabled={isUpdating} value={selectedDoctor} onChange={(event) => onDoctorChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
              {doctors.map((doctor) => <option key={doctor} value={doctor}>{doctor}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-ink">
            Consultorio
            <select disabled={isUpdating} value={selectedRoom} onChange={(event) => onRoomChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50">
              {rooms.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-ink">
            Fecha
            <input disabled={isUpdating} type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-ink">
            Hora
            <input disabled={isUpdating} type="time" value={selectedTime} onChange={(event) => onTimeChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted disabled:bg-slate-50" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-ink md:col-span-2">
            Nota interna
            <textarea disabled={isUpdating} value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted outline-none ring-primary/20 focus:ring-4 disabled:bg-slate-50" placeholder="Ej. confirmar por WhatsApp, paciente solicita horario puntual..." />
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isUpdating} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-muted transition hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
          <button disabled={isUpdating} className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primaryHover disabled:cursor-not-allowed disabled:bg-slate-300">
            {isUpdating ? "Guardando cambios..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;

  const styles: Record<ToastType, string> = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    error: "border-red-100 bg-red-50 text-red-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
    info: "border-blue-100 bg-blue-50 text-blue-800"
  };

  const iconClass: Record<ToastType, string> = {
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600"
  };

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6">
      <div className={`rounded-3xl border p-4 shadow-soft ${styles[toast.type]}`}>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className={`mt-0.5 shrink-0 ${iconClass[toast.type]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-full p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100" aria-label="Cerrar notificación">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, settings, showDay = true, mode = "app", onStatusChange, onEdit }: { appointment: DecoratedAppointment; settings: ClinicSettings; showDay?: boolean; mode?: "app" | "demo"; onStatusChange: (appointment: DecoratedAppointment, nextStatus: string) => void; onEdit: (appointment: DecoratedAppointment) => void }) {
  const isDemo = mode === "demo";
  const isEditable = ["pending", "scheduled", "confirmed"].includes(appointment.status);
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={statusLabels[appointment.status] || appointment.status} variant={statusVariant(appointment.status)} />
            {showDay ? <span className="text-xs font-semibold uppercase text-slate-400">{formatDay(appointment.starts_at, settings.locale)}</span> : null}
          </div>
          <h3 className="mt-3 text-lg font-bold text-ink">{appointment.patients?.full_name || "Paciente sin asignar"}</h3>
          <p className="mt-1 text-sm text-muted">{appointment.services?.name || "Servicio sin asignar"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left sm:text-right">
          <div className="flex items-center gap-2 text-sm font-bold text-ink sm:justify-end"><Clock size={16} /> {formatHour(appointment.starts_at, settings.locale)}</div>
          <p className="mt-1 text-xs text-muted">{appointment.services?.duration_minutes || 45} min · {appointment.room_name}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
        <span className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Doctor:</b><br />{appointment.doctor_name}</span>
        <span className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Teléfono:</b><br />{appointment.patients?.phone || "Sin teléfono"}</span>
        <span className="rounded-2xl bg-slate-50 p-3"><b className="text-ink">Valor:</b><br />{formatCurrency(Number(appointment.services?.price || 0), settings)}</span>
      </div>
      {appointment.notes ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nota interna</p>
          <p className="mt-2 leading-6">{appointment.notes}</p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isDemo && isEditable ? (
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary/30 hover:text-primary"
            >
              <Edit3 size={15} /> Editar cita
            </button>
          ) : null}
          <p className="text-xs text-muted sm:ml-auto">Cambiar estado de la cita</p>
        </div>
        <select
          disabled={isDemo}
          value={appointment.status}
          onChange={(event) => onStatusChange(appointment, event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink outline-none ring-primary/20 focus:ring-4 disabled:bg-slate-50 disabled:text-muted"
        >
          <option value="scheduled">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Finalizada</option>
          <option value="cancelled">Cancelada</option>
          <option value="no_show">No asistió</option>
        </select>
      </div>
    </article>
  );
}
