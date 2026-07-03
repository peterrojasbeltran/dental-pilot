import Link from "next/link";
import { WalletCards } from "lucide-react";
import { MobileMenu } from "./mobile-menu";

export function DemoHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
            <WalletCards size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Dental Pilot</p>
            <p className="text-xs text-muted">Demo pública</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <Link href="/demo/dashboard" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-ink">
            Dashboard demo
          </Link>
          <Link href="/demo/patients" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-ink">
            CRM demo
          </Link>
          <Link href="/login" className="btn-secondary">
            Ingresar
          </Link>
        </nav>

        <MobileMenu
          brandHref="/demo/dashboard"
          brandSubtitle="Demo pública"
          items={[
            { href: "/demo/dashboard", label: "Dashboard demo" },
            { href: "/demo/patients", label: "CRM demo" },
            { href: "/login", label: "Ingresar al sistema" },
          ]}
        />
      </div>
    </header>
  );
}
