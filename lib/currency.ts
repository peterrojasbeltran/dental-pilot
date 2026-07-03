import type { ClinicSettings } from "@/types/database";

export const DEFAULT_CURRENCY = {
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "es-BO",
  currencyCode: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE || "BOB",
  currencySymbol: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL || "Bs"
};

export function formatMoney(value: number, settings?: Pick<ClinicSettings, "locale" | "currency_code" | "currency_symbol">) {
  const locale = settings?.locale || DEFAULT_CURRENCY.locale;
  const currencyCode = settings?.currency_code || DEFAULT_CURRENCY.currencyCode;
  const symbol = settings?.currency_symbol || DEFAULT_CURRENCY.currencySymbol;

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(value);

    // Para Bolivia preferimos mostrar Bs de forma clara aunque Intl devuelva BOB.
    return formatted.replace(currencyCode, symbol);
  } catch {
    return `${symbol} ${value.toFixed(2)}`;
  }
}


// Alias usado por componentes nuevos de agenda.
// Mantiene compatibilidad con formatMoney sin duplicar lógica.
export function formatCurrency(value: number, settings?: Pick<ClinicSettings, "locale" | "currency_code" | "currency_symbol">) {
  return formatMoney(value, settings);
}
