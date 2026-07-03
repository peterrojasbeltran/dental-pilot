export const dynamic = "force-dynamic";

import { AppointmentWorkspace } from "@/components/appointments/appointment-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { getAppointments, getClinicSettings, getPatients, getServices, getDoctors, getConsultingRooms } from "@/lib/data";

export default async function AppointmentsPage() {
  const [settings, appointments, patients, services, doctors, consultingRooms] = await Promise.all([
    getClinicSettings(),
    getAppointments(),
    getPatients(),
    getServices(),
    getDoctors(),
    getConsultingRooms()
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <StatusPill label="Agenda operativa" variant="primary" />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Agenda inteligente</h1>
        <p className="max-w-3xl text-muted">Gestiona citas, revisa estados y prioriza acciones de seguimiento desde una vista clara para recepción y doctores.</p>
      </div>
      <div className="mt-6">
        <AppointmentWorkspace appointments={appointments} patients={patients} services={services} settings={settings} doctors={doctors} consultingRooms={consultingRooms} />
      </div>
    </AppShell>
  );
}
