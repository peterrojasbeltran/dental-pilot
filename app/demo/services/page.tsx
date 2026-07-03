import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { demoClinicSettings, demoServices } from "@/lib/demo-data";
import { formatMoney } from "@/lib/currency";

export default function DemoServicesPage() {
  return (
    <AppShell mode="demo">
      <div className="flex flex-col gap-2">
        <StatusPill label="DEMO MODE · Datos ficticios · Solo lectura" variant="primary" />
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Servicios y precios</h1>
        <p className="max-w-3xl text-muted">Catálogo base para cotizaciones, agenda y seguimiento comercial.</p>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoServices.map((service) => (
          <article key={service.id} className="card p-5">
            <h2 className="font-bold text-ink">{service.name}</h2>
            <p className="mt-2 text-sm text-muted">Duración estimada: {service.duration_minutes} min</p>
            <p className="mt-4 text-2xl font-bold text-primary">{formatMoney(Number(service.price), demoClinicSettings)}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
