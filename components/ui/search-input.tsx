"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

// Buscador reutilizable para evitar inconsistencias visuales entre módulos.
export function SearchInput({ value, onChange, placeholder = "Buscar...", className, inputClassName }: SearchInputProps) {
  return (
    <label className={cn(
      "flex h-11 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-blue-100",
      className
    )}>
      <Search className="shrink-0 text-slate-400" size={18} aria-hidden="true" />
      <input
        className={cn("min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-slate-400", inputClassName)}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
