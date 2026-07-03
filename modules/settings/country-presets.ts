export const countryPresets = [
  { country: "Bolivia", currency_code: "BOB", currency_symbol: "Bs", timezone: "America/La_Paz", locale: "es-BO" },
  { country: "Perú", currency_code: "PEN", currency_symbol: "S/", timezone: "America/Lima", locale: "es-PE" },
  { country: "Chile", currency_code: "CLP", currency_symbol: "$", timezone: "America/Santiago", locale: "es-CL" },
  { country: "Colombia", currency_code: "COP", currency_symbol: "$", timezone: "America/Bogota", locale: "es-CO" },
  { country: "México", currency_code: "MXN", currency_symbol: "$", timezone: "America/Mexico_City", locale: "es-MX" }
];

export function getCountryPreset(country: string) {
  return countryPresets.find((item) => item.country === country) || countryPresets[0];
}
