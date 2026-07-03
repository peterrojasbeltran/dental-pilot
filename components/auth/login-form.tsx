"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-ink">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-primary/20 transition focus:ring-4" placeholder="admin@clinica.com" required />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-ink">Contraseña</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-primary/20 transition focus:ring-4" placeholder="••••••••" required />
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primaryHover disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="text-xs text-muted">Usa las credenciales registradas para la clínica.</p>
    </form>
  );
}
