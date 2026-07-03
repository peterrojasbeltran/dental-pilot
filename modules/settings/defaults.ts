import type { ClinicSettings } from "@/types/database";

export const DEFAULT_CLINIC_SETTINGS: Omit<ClinicSettings, "id"> = {
  clinic_name: "Clínica Dental Demo",
  country: "Bolivia",
  currency_code: "BOB",
  currency_symbol: "Bs",
  locale: "es-BO",
  timezone: "America/La_Paz"
};
