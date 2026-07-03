import Link from "next/link";
import { Bell } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MobileMenu } from "./mobile-menu";
import { demoNavItems, navItems } from "./nav-items";
import { APP_VERSION } from "@/lib/version";
import { GlobalSearch } from "./global-search";

export type OperationalAlert = {
  title: string;
  description: string;
  href: string;
  tone?: "warning" | "info" | "success";
};

type TopbarProps = {
  mode?: "app" | "demo";
  operationalAlerts?: OperationalAlert[];
};

export function Topbar({ mode = "app", operationalAlerts = [] }: TopbarProps) {
  const isDemo = mode === "demo";
  const menuItems = isDemo ? [...demoNavItems.map((item) => ({ href: item.href, label: item.label })), { href: "/login", label: "Ingresar al sistema" }] : navItems.map((item) => ({ href: item.href, label: item.label }));
  const alertCount = operationalAlerts.length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileMenu items={menuItems} brandHref={isDemo ? "/demo/dashboard" : "/dashboard"} brandSubtitle={isDemo ? "Demo pública" : "Clínica Bolivia · Bs"} />

        <GlobalSearch mode={mode} />

        <div className="min-w-0 flex-1 sm:hidden">
          <p className="truncate text-sm font-bold text-ink">Dental Pilot {APP_VERSION}</p>
          <p className="truncate text-xs text-muted">{isDemo ? "Demo pública · solo lectura" : "Clínica Bolivia · Bs"}</p>
        </div>

        {isDemo ? <span className="hidden rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-primary sm:inline-flex">DEMO MODE</span> : null}

        <details className="group relative">
          <summary className="relative list-none rounded-2xl border border-slate-200 bg-white p-3 text-muted shadow-soft transition hover:text-ink marker:hidden">
            <Bell size={18} />
            {alertCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            ) : null}
          </summary>
          <div className="absolute right-0 mt-3 w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
            <div className="border-b border-slate-100 px-2 pb-3">
              <p className="text-sm font-bold text-ink">Alertas operativas</p>
              <p className="mt-1 text-xs text-muted">Acciones que requieren atención.</p>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {alertCount ? operationalAlerts.map((alert, index) => (
                <Link key={`${alert.href}-${index}`} href={alert.href} className="block rounded-2xl p-3 transition hover:bg-slate-50">
                  <p className="text-sm font-semibold text-ink">{alert.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{alert.description}</p>
                </Link>
              )) : (
                <div className="p-4 text-center text-sm text-muted">No hay alertas pendientes.</div>
              )}
            </div>
          </div>
        </details>
        {isDemo ? null : <SignOutButton />}
      </div>
    </header>
  );
}
