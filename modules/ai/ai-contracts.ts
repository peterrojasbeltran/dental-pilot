export type LeadClassification = {
  intent: "schedule_appointment" | "ask_price" | "emergency" | "follow_up" | "unknown";
  priority: "low" | "medium" | "high";
  probable_service: string | null;
  suggested_reply: string;
  next_action: "request_missing_data" | "offer_available_slots" | "send_to_human" | "create_recovery_task";
  risk_level: "low" | "medium" | "high";
};

// Contrato JSON esperado para evitar respuestas libres sin control.
export const leadClassificationSchemaDescription = {
  intent: "Intención detectada del paciente",
  priority: "Prioridad comercial/operativa",
  probable_service: "Servicio dental probable si existe",
  suggested_reply: "Mensaje sugerido para WhatsApp o recepción",
  next_action: "Siguiente acción operativa",
  risk_level: "Nivel de riesgo de pérdida del paciente"
};
