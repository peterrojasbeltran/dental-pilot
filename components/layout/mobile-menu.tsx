"use client";

import Link from "next/link";
import { Menu, X, WalletCards } from "lucide-react";
import { useState } from "react";
import { navItems } from "./nav-items";
import { NavLink } from "./nav-link";

type MobileMenuItem = {
  href: string;
  label: string;
};

export function MobileMenu({
  items,
  brandHref = "/dashboard",
  brandSubtitle = "AI Revenue OS",
}: {
  items?: MobileMenuItem[];
  brandHref?: string;
  brandSubtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuItems = items ?? navItems.map((item) => ({ href: item.href, label: item.label }));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((value) => !value)}
        className="rounded-2xl border border-slate-200 bg-white p-3 text-muted shadow-soft transition hover:text-ink"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 border-b border-slate-200 bg-white px-4 py-4 shadow-soft">
          <Link href={brandHref} onClick={() => setOpen(false)} className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <WalletCards size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Dental Pilot</p>
              <p className="text-xs text-muted">{brandSubtitle}</p>
            </div>
          </Link>

          <nav className="grid gap-1">
            {menuItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} onClick={() => setOpen(false)} mobile />
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
