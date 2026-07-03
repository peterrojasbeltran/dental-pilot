import Link from "next/link";
import { CalendarDays, MessageSquareText, Sparkles, UsersRound } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

const capabilities = [
  {
    title: "CRM dental con IA",
    description: "Organiza pacientes, etapas comerciales y próximos pasos desde una sola vista.",
    icon: UsersRound
  },
  {
    title: "Agenda inteligente",
    description: "Gestiona citas, doctores, estados y seguimiento sin perder contexto del paciente.",
    icon: CalendarDays
  },
  {
    title: "Seguimiento asistido",
    description: "Prepara respuestas, recordatorios y acciones para recuperar pacientes inactivos.",
    icon: MessageSquareText
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center text-center">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">
          Dental Pilot {APP_VERSION} · Plataforma dental con IA
        </span>

        <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-6xl">
          AI Revenue OS para clínicas dentales
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
          Recupera pacientes, automatiza seguimiento y aumenta ingresos con una experiencia moderna para recepción, doctores y dirección.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link className="btn-primary" href="/login">
            Ingresar al sistema
          </Link>
          <Link href="/demo/dashboard" className="text-sm font-semibold text-primary transition hover:text-primaryHover">
            Explorar demo interactiva
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-5xl gap-4 md:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card p-5 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                  <Icon size={20} />
                </div>
                <p className="mt-4 text-base font-bold text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-muted shadow-soft">
          <Sparkles size={14} className="text-primary" />
          Demo con datos ficticios · Sistema real protegido con acceso seguro
        </div>
      </section>
    </main>
  );
}
