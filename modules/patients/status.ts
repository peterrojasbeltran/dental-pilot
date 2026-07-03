import type { PatientStatus, RiskLevel } from "@/types/database";

export const patientStatusOrder: PatientStatus[] = [
  "new_lead",
  "contacted",
  "scheduled",
  "attended",
  "budgeted",
  "in_treatment",
  "inactive",
  "recovery",
  "finished"
];

export const patientStatusLabel: Record<PatientStatus, string> = {
  new_lead: "Nuevo lead",
  contacted: "Contactado",
  scheduled: "Agendado",
  attended: "Asistió",
  budgeted: "Presupuestado",
  in_treatment: "En tratamiento",
  inactive: "Inactivo",
  recovery: "Recuperación",
  finished: "Finalizado"
};

export const riskLabel: Record<RiskLevel, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto"
};

export function getRiskVariant(risk: RiskLevel) {
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "success" as const;
}
