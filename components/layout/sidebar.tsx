"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { demoNavItems, navItems } from "./nav-items";
import { APP_VERSION } from "@/lib/version";
import { NavLink } from "./nav-link";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mode?: "app" | "demo";
};

export function Sidebar({ mode = "app" }: SidebarProps) {
  const items = mode === "demo" ? demoNavItems : navItems;
  const brandHref = mode === "demo" ? "/demo/dashboard" : "/dashboard";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("dental-pilot-sidebar-collapsed");
    const shouldCollapse = saved === "true";
    document.documentElement.dataset.dpSidebarCollapsed = String(shouldCollapse);
    setCollapsed(shouldCollapse);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("dental-pilot-sidebar-collapsed", String(next));
      document.documentElement.dataset.dpSidebarCollapsed = String(next);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "dp-sidebar hidden min-h-screen border-r border-slate-200 bg-white p-5 transition-all duration-200 lg:block",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={brandHref}
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed ? "justify-center" : "",
          )}
          title={collapsed ? `Dental Pilot · ${APP_VERSION}` : undefined}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <WalletCards size={22} />
          </div>
          {!collapsed ? (
            <div className="dp-sidebar-label min-w-0">
              <p className="truncate text-base font-bold text-ink">Dental Pilot</p>
              <p className="truncate text-xs text-muted">{APP_VERSION} · Copiloto dental</p>
            </div>
          ) : null}
        </Link>

        {!collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-primary hover:text-primary"
            aria-label="Contraer menú"
            title="Contraer menú"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-primary hover:text-primary"
          aria-label="Expandir menú"
          title="Expandir menú"
        >
          <ChevronRight size={16} />
        </button>
      ) : null}

      {mode === "demo" && !collapsed ? (
        <div className="dp-sidebar-label mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-primary">
          DEMO MODE · Datos ficticios · Solo lectura
        </div>
      ) : null}

      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {mode === "demo" && !collapsed ? (
        <Link
          href="/login"
          className="dp-sidebar-label mt-8 block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primaryHover"
        >
          Ingresar al sistema
        </Link>
      ) : null}
    </aside>
  );
}
