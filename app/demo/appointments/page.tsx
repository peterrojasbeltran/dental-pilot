import { AppointmentWorkspace } from "@/components/appointments/appointment-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { demoAppointments, demoClinicSettings, demoConsultingRooms, demoDoctors, demoPatients, demoServices } from "@/lib/demo-data";

export default function DemoAppointmentsPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-2">
        <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Agenda</h1>
        <p className="max-w-3xl text-muted">Organiza citas, revisa estados y conecta la agenda con el seguimiento comercial de pacientes.</p>
      </div>
      <div className="mt-6">
        <AppointmentWorkspace
          mode="demo"
          appointments={demoAppointments}
          patients={demoPatients}
          services={demoServices}
          settings={demoClinicSettings}
          doctors={demoDoctors}
          consultingRooms={demoConsultingRooms}
        />
      </div>
    </AppShell>
  );
}
