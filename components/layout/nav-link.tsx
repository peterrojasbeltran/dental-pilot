"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bot, CalendarDays, CreditCard, Gauge, MessageSquareText, Package, ReceiptText, Settings, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
  onClick?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
};

function getIconByHref(href: string) {
  const normalized = href.replace("/demo", "");

  if (normalized.startsWith("/patients")) return Users;
  if (normalized.startsWith("/appointments")) return CalendarDays;
  if (normalized.startsWith("/services")) return Stethoscope;
  if (normalized.startsWith("/treatments")) return Activity;
  if (normalized.startsWith("/payments")) return CreditCard;
  if (normalized.startsWith("/reports")) return BarChart3;
  if (normalized.startsWith("/finances")) return ReceiptText;
  if (normalized.startsWith("/automations")) return MessageSquareText;
  if (normalized.startsWith("/inventory")) return Package;
  if (normalized.startsWith("/ai-assistant")) return Bot;
  if (normalized.startsWith("/settings")) return Settings;
  return Gauge;
}

export function NavLink({ href, label, onClick, mobile = false, collapsed = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && href !== "/demo/dashboard" && pathname.startsWith(`${href}/`));
  const Icon = getIconByHref(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "dp-sidebar-navlink flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-blue-50 text-primary ring-1 ring-blue-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-ink",
        mobile && isActive ? "border-l-4 border-primary" : ""
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      <span className={collapsed ? "sr-only dp-sidebar-label" : "dp-sidebar-label"}>{label}</span>
    </Link>
  );
}
