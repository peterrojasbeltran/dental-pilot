import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { StatusPill } from "@/components/ui/status-pill";
import { APP_VERSION } from "@/lib/version";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2">
        <div>
          <StatusPill label={`Acceso seguro · ${APP_VERSION}`} variant="primary" />
          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-5xl">Ingresa a Dental Pilot</h1>
          <p className="mt-4 text-muted">Ingresa con las credenciales de la clínica. También puedes explorar la demo pública con datos ficticios antes de ingresar con una cuenta real.</p>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Usa un usuario registrado para ingresar al sistema real de la clínica.
          </div>
        </div>
        <Suspense fallback={<div className="card p-5 text-sm text-muted">Cargando formulario...</div>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
