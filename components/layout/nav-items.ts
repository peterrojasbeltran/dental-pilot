// Menú principal compartido por sidebar desktop y menú mobile.
// Importante: aquí NO se importan componentes de íconos.
// Next.js no permite pasar funciones/componentes desde Server Components a Client Components.
export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Pacientes" },
  { href: "/appointments", label: "Agenda" },
  { href: "/services", label: "Servicios" },
  { href: "/treatments", label: "Tratamientos" },
  { href: "/payments", label: "Pagos" },
  { href: "/reports", label: "Reportes" },
  { href: "/finances", label: "Finanzas" },
  { href: "/automations", label: "Automatizaciones" },
  { href: "/inventory", label: "Inventario" },
  { href: "/ai-assistant", label: "Asistente IA" },
  { href: "/settings", label: "Configuración" }
];

export const demoNavItems = [
  { href: "/demo/dashboard", label: "Dashboard" },
  { href: "/demo/patients", label: "Pacientes" },
  { href: "/demo/appointments", label: "Agenda" },
  { href: "/demo/services", label: "Servicios" },
  { href: "/demo/treatments", label: "Tratamientos" },
  { href: "/demo/payments", label: "Pagos" },
  { href: "/demo/reports", label: "Reportes" },
  { href: "/demo/finances", label: "Finanzas" },
  { href: "/demo/automations", label: "Automatizaciones" },
  { href: "/demo/inventory", label: "Inventario" },
  { href: "/demo/ai-assistant", label: "Asistente IA" }
];
