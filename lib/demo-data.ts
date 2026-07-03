import type { Appointment, Budget, ClinicSettings, ConsultingRoom, Doctor, Expense, ExpenseCategory, Patient, Payment, Service, Treatment } from "@/types/database";

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

export const demoClinicSettings: ClinicSettings = {
  id: "demo-clinic",
  clinic_name: "Clínica Dental Demo",
  country: "Bolivia",
  currency_code: "BOB",
  currency_symbol: "Bs",
  locale: "es-BO",
  timezone: "America/La_Paz",
  tax_enabled: false
};

export const demoPatients: Patient[] = [
  {
    id: "p1",
    full_name: "Ana Martínez",
    phone: "+591 70000001",
    email: "ana@email.com",
    source: "WhatsApp",
    status: "scheduled",
    risk_level: "low",
    notes: "Interesada en limpieza dental. Confirmó preferencia por horario de tarde.",
    created_at: daysAgo(8),
    last_contact_at: daysAgo(1),
    active_treatment: "Limpieza dental",
    estimated_value: 250,
    ai_summary: "Paciente con intención clara. Ya aceptó horario tentativo y solo falta confirmación final.",
    next_action: "Confirmar asistencia 24 horas antes de la cita."
  },
  {
    id: "p2",
    full_name: "Luis Roca",
    phone: "+591 70000002",
    email: null,
    source: "Instagram",
    status: "new_lead",
    risk_level: "medium",
    notes: "Pidió precio de ortodoncia y preguntó por facilidades de pago.",
    created_at: daysAgo(2),
    last_contact_at: daysAgo(2),
    active_treatment: "Evaluación ortodoncia",
    estimated_value: 3500,
    ai_summary: "Lead de alto valor con objeción probable de precio. Conviene ofrecer evaluación inicial y opciones de pago.",
    next_action: "Enviar mensaje con beneficios y horarios disponibles."
  },
  {
    id: "p3",
    full_name: "María Suárez",
    phone: "+591 70000003",
    email: null,
    source: "Recepción",
    status: "recovery",
    risk_level: "high",
    notes: "No volvió a control hace 45 días. Tiene tratamiento de implante pendiente.",
    created_at: daysAgo(90),
    last_contact_at: daysAgo(45),
    active_treatment: "Implante dental",
    estimated_value: 7000,
    ai_summary: "Paciente en riesgo alto por abandono de tratamiento. Tiene valor pendiente importante.",
    next_action: "Contactar con tono empático y ofrecer reprogramación."
  },
  {
    id: "p4",
    full_name: "Carlos Méndez",
    phone: "+591 70000004",
    email: "carlos@email.com",
    source: "Referido",
    status: "contacted",
    risk_level: "low",
    notes: "Consultó por blanqueamiento para evento familiar.",
    created_at: daysAgo(4),
    last_contact_at: daysAgo(1),
    active_treatment: "Blanqueamiento",
    estimated_value: 900,
    ai_summary: "Interés estético con fecha objetivo. Alta probabilidad de agendar si se responde rápido.",
    next_action: "Ofrecer dos horarios esta semana."
  },
  {
    id: "p5",
    full_name: "Sofía Vargas",
    phone: "+591 70000005",
    email: null,
    source: "WhatsApp",
    status: "budgeted",
    risk_level: "low",
    notes: "Asistió a evaluación. Quedó pendiente enviar presupuesto final.",
    created_at: daysAgo(12),
    last_contact_at: daysAgo(0),
    active_treatment: "Caries múltiples",
    estimated_value: 1200,
    ai_summary: "Ya asistió. El siguiente paso comercial es cerrar presupuesto antes de que se enfríe.",
    next_action: "Enviar presupuesto y solicitar confirmación."
  },
  {
    id: "p6",
    full_name: "Jorge Camacho",
    phone: "+591 70000006",
    email: null,
    source: "Campaña",
    status: "in_treatment",
    risk_level: "medium",
    notes: "Tratamiento de ortodoncia activo. Se atrasó en el último control.",
    created_at: daysAgo(120),
    last_contact_at: daysAgo(10),
    active_treatment: "Ortodoncia",
    estimated_value: 3500,
    ai_summary: "Paciente activo, pero con señal temprana de riesgo por atraso de control.",
    next_action: "Recordar control pendiente y ofrecer horarios."
  },
  {
    id: "p7",
    full_name: "Paola Gutiérrez",
    phone: "+591 70000007",
    email: "paola@email.com",
    source: "Google Maps",
    status: "inactive",
    risk_level: "high",
    notes: "Canceló dos veces su cita de endodoncia.",
    created_at: daysAgo(30),
    last_contact_at: daysAgo(18),
    active_treatment: "Endodoncia",
    estimated_value: 1800,
    ai_summary: "Riesgo alto por cancelaciones repetidas. Requiere mensaje corto y opción de horarios flexibles.",
    next_action: "Enviar recuperación con opción de reagendar."
  },
  {
    id: "p8",
    full_name: "Ricardo Paz",
    phone: "+591 70000008",
    email: null,
    source: "WhatsApp",
    status: "finished",
    risk_level: "low",
    notes: "Finalizó limpieza. Candidato para recordatorio preventivo en 6 meses.",
    created_at: daysAgo(70),
    last_contact_at: daysAgo(7),
    active_treatment: "Control preventivo",
    estimated_value: 250,
    ai_summary: "Paciente finalizado. Puede entrar a automatización futura de mantenimiento.",
    next_action: "Programar recordatorio de control semestral."
  }
];

export const demoServices: Service[] = [
  { id: "s1", name: "Limpieza dental", description: "Profilaxis y limpieza preventiva.", category: "Preventiva", price: 250, duration_minutes: 45, is_active: true },
  { id: "s2", name: "Evaluación ortodoncia", description: "Consulta inicial para ortodoncia.", category: "Ortodoncia", price: 150, duration_minutes: 30, is_active: true },
  { id: "s3", name: "Blanqueamiento", description: "Tratamiento estético dental.", category: "Estética", price: 900, duration_minutes: 60, is_active: true },
  { id: "s4", name: "Implante dental", description: "Plan quirúrgico y rehabilitación.", category: "Cirugía", price: 7000, duration_minutes: 90, is_active: true }
];


export const demoDoctors: Doctor[] = [
  { id: "doc1", full_name: "Dra. Camila Rojas", specialty: "Odontología general", email: "camila@demo.com", phone: "+591 70001001", is_active: true, notes: "Atención general y prevención.", created_at: daysAgo(30), updated_at: daysAgo(1) },
  { id: "doc2", full_name: "Dr. Andrés Méndez", specialty: "Ortodoncia", email: "andres@demo.com", phone: "+591 70001002", is_active: true, notes: "Evaluaciones y controles de ortodoncia.", created_at: daysAgo(30), updated_at: daysAgo(1) },
  { id: "doc3", full_name: "Dra. Valeria Paz", specialty: "Estética dental", email: "valeria@demo.com", phone: "+591 70001003", is_active: true, notes: "Blanqueamientos y estética.", created_at: daysAgo(30), updated_at: daysAgo(1) }
];

export const demoConsultingRooms: ConsultingRoom[] = [
  { id: "room1", name: "Consultorio 1", description: "Atención general", is_active: true, notes: "Unidad principal.", created_at: daysAgo(30), updated_at: daysAgo(1) },
  { id: "room2", name: "Consultorio 2", description: "Ortodoncia", is_active: true, notes: "Unidad secundaria.", created_at: daysAgo(30), updated_at: daysAgo(1) },
  { id: "room3", name: "Consultorio 3", description: "Estética", is_active: true, notes: "Espacio auxiliar.", created_at: daysAgo(30), updated_at: daysAgo(1) }
];

export const demoAppointments: Appointment[] = [
  { id: "a1", starts_at: daysFromNow(0), ends_at: daysFromNow(0), status: "confirmed", doctor_name: "Dra. Camila Rojas", room_name: "Consultorio 1", patients: { full_name: "Ana Martínez", phone: "+591 70000001" }, services: { name: "Limpieza dental", price: 250, duration_minutes: 45 } },
  { id: "a2", starts_at: daysFromNow(1), ends_at: daysFromNow(1), status: "pending", doctor_name: "Dr. Andrés Méndez", room_name: "Consultorio 2", patients: { full_name: "Luis Roca", phone: "+591 70000002" }, services: { name: "Evaluación ortodoncia", price: 150, duration_minutes: 30 } },
  { id: "a3", starts_at: daysFromNow(2), ends_at: daysFromNow(2), status: "confirmed", doctor_name: "Dra. Valeria Paz", room_name: "Consultorio 3", patients: { full_name: "Carlos Méndez", phone: "+591 70000004" }, services: { name: "Blanqueamiento", price: 900, duration_minutes: 60 } },
  { id: "a4", starts_at: daysFromNow(3), ends_at: daysFromNow(3), status: "completed", doctor_name: "Dra. Camila Rojas", room_name: "Consultorio 1", patients: { full_name: "Sofía Vargas", phone: "+591 70000005" }, services: { name: "Evaluación ortodoncia", price: 150, duration_minutes: 30 } },
  { id: "a5", starts_at: daysFromNow(4), ends_at: daysFromNow(4), status: "no_show", doctor_name: "Dr. Andrés Méndez", room_name: "Consultorio 2", patients: { full_name: "Paola Gutiérrez", phone: "+591 70000007" }, services: { name: "Implante dental", price: 7000, duration_minutes: 90 } },
  { id: "a6", starts_at: daysFromNow(5), ends_at: daysFromNow(5), status: "confirmed", doctor_name: "Dra. Valeria Paz", room_name: "Consultorio 3", patients: { full_name: "Jorge Camacho", phone: "+591 70000006" }, services: { name: "Evaluación ortodoncia", price: 150, duration_minutes: 30 } }
];


export const demoTreatments: Treatment[] = [
  {
    id: "t1",
    patient_id: "p5",
    title: "Plan restaurativo caries múltiples",
    notes: "Paciente requiere limpieza inicial y restauraciones por etapas.",
    status: "budgeted",
    total_amount: 1450,
    start_date: new Date().toISOString().slice(0, 10),
    estimated_end_date: null,
    created_at: daysAgo(1),
    patients: { full_name: "Sofía Vargas", phone: "+591 70000005", status: "budgeted" },
    treatment_services: [
      { id: "ts1", treatment_id: "t1", service_id: "s1", quantity: 1, unit_price: 250, total_price: 250, services: { name: "Limpieza dental", duration_minutes: 45, category: "Preventiva" } },
      { id: "ts2", treatment_id: "t1", service_id: "s3", quantity: 1, unit_price: 900, total_price: 900, services: { name: "Blanqueamiento", duration_minutes: 60, category: "Estética" } }
    ],
    budgets: []
  },
  {
    id: "t2",
    patient_id: "p6",
    title: "Ortodoncia activa",
    notes: "Control mensual pendiente.",
    status: "in_progress",
    total_amount: 3500,
    start_date: daysAgo(60).slice(0, 10),
    estimated_end_date: null,
    created_at: daysAgo(60),
    patients: { full_name: "Jorge Camacho", phone: "+591 70000006", status: "in_treatment" },
    treatment_services: [
      { id: "ts3", treatment_id: "t2", service_id: "s2", quantity: 1, unit_price: 3500, total_price: 3500, services: { name: "Evaluación ortodoncia", duration_minutes: 30, category: "Ortodoncia" } }
    ],
    budgets: []
  }
];

export const demoBudgets: Budget[] = [
  {
    id: "b1",
    treatment_id: "t1",
    patient_id: "p5",
    status: "approved",
    subtotal_amount: 1450,
    discount_amount: 100,
    total_amount: 1350,
    paid_amount: 500,
    payment_status: "partial",
    created_at: daysAgo(1),
    expires_at: daysFromNow(14),
    patients: { full_name: "Sofía Vargas", phone: "+591 70000005" },
    treatments: { title: "Plan restaurativo caries múltiples", status: "budgeted" },
    budget_items: [
      { id: "bi1", budget_id: "b1", service_id: "s1", description: "Limpieza dental", quantity: 1, unit_price: 250, total_price: 250, services: { name: "Limpieza dental", category: "Preventiva" } },
      { id: "bi2", budget_id: "b1", service_id: "s3", description: "Blanqueamiento", quantity: 1, unit_price: 900, total_price: 900, services: { name: "Blanqueamiento", category: "Estética" } }
    ]
  }
];


export const demoPayments: Payment[] = [
  {
    id: "pay1",
    budget_id: "b1",
    patient_id: "p5",
    treatment_id: "t1",
    amount: 500,
    method: "qr",
    status: "active",
    paid_at: daysAgo(0),
    notes: "Pago inicial demo",
    patients: { full_name: "Sofía Vargas", phone: "+591 70000005" },
    budgets: { id: "b1", total_amount: 1350, paid_amount: 500, payment_status: "partial", status: "approved" },
    treatments: { title: "Plan restaurativo caries múltiples", status: "budgeted" }
  }
];

export const demoAutomationRules = [
  { id: "ar1", kind: "appointment_reminder", title: "Recordatorio de cita", description: "Aviso antes de la cita para reducir inasistencias.", is_enabled: true, trigger_label: "24 horas antes de la cita", timing_value: 24, timing_unit: "hours", created_at: daysAgo(5), updated_at: daysAgo(0) },
  { id: "ar2", kind: "budget_followup", title: "Seguimiento de presupuesto", description: "Mensaje para pacientes con presupuesto enviado y sin respuesta.", is_enabled: true, trigger_label: "3 días después de enviado", timing_value: 3, timing_unit: "days", created_at: daysAgo(5), updated_at: daysAgo(1) },
  { id: "ar3", kind: "patient_recovery", title: "Recuperación de pacientes", description: "Reactivación de pacientes sin actividad reciente.", is_enabled: false, trigger_label: "90 días sin cita", timing_value: 90, timing_unit: "days", created_at: daysAgo(5), updated_at: daysAgo(1) },
  { id: "ar4", kind: "birthday", title: "Cumpleaños", description: "Mensaje de cumpleaños para reforzar relación con el paciente.", is_enabled: false, trigger_label: "Día del cumpleaños", timing_value: 0, timing_unit: "days", created_at: daysAgo(5), updated_at: daysAgo(1) }
] as const;

export const demoAutomationTemplates = [
  { id: "at1", kind: "appointment_reminder", name: "Recordatorio de cita", body: "Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. Responde CONFIRMAR para confirmar tu asistencia.", variables: ["nombre", "fecha", "hora"], updated_at: daysAgo(0) },
  { id: "at2", kind: "budget_followup", name: "Seguimiento de presupuesto", body: "Hola {{nombre}}, tu presupuesto de {{tratamiento}} sigue pendiente. ¿Quieres que te ayudemos a resolver alguna duda?", variables: ["nombre", "tratamiento"], updated_at: daysAgo(1) },
  { id: "at3", kind: "patient_recovery", name: "Recuperación de paciente", body: "Hola {{nombre}}, hace tiempo no vienes a control. Podemos ayudarte a agendar una revisión preventiva esta semana.", variables: ["nombre"], updated_at: daysAgo(2) },
  { id: "at4", kind: "birthday", name: "Cumpleaños", body: "¡Feliz cumpleaños {{nombre}}! Te deseamos un excelente día de parte de Dental Pilot Demo.", variables: ["nombre"], updated_at: daysAgo(3) }
] as const;

export const demoAutomationHistory = [
  { id: "ah1", kind: "appointment_reminder", patient_name: "Ana Martínez", target_label: "Limpieza dental", status: "scheduled", channel: "simulation", scheduled_for: daysFromNow(1), sent_at: null, message_preview: "Recordatorio de cita para mañana a las 10:00." },
  { id: "ah2", kind: "budget_followup", patient_name: "Sofía Vargas", target_label: "Plan restaurativo", status: "simulated", channel: "simulation", scheduled_for: daysFromNow(2), sent_at: null, message_preview: "Seguimiento de presupuesto enviado hace 3 días." },
  { id: "ah3", kind: "patient_recovery", patient_name: "María Suárez", target_label: "Implante dental", status: "scheduled", channel: "simulation", scheduled_for: daysFromNow(5), sent_at: null, message_preview: "Paciente sin actividad reciente para recuperación." }
] as const;

export const demoInventoryItems = [
  { id: "inv1", name: "Guantes nitrilo", category: "Bioseguridad", unit: "caja", current_stock: 15, minimum_stock: 20, is_active: true, notes: "Uso diario en recepción y consultorio.", created_at: daysAgo(20), updated_at: daysAgo(1) },
  { id: "inv2", name: "Anestesia dental", category: "Clínico", unit: "unidad", current_stock: 8, minimum_stock: 10, is_active: true, notes: "Revisar reposición semanal.", created_at: daysAgo(18), updated_at: daysAgo(2) },
  { id: "inv3", name: "Resina compuesta", category: "Restauración", unit: "unidad", current_stock: 24, minimum_stock: 8, is_active: true, notes: "Stock suficiente.", created_at: daysAgo(15), updated_at: daysAgo(3) },
  { id: "inv4", name: "Cubrebocas", category: "Bioseguridad", unit: "caja", current_stock: 30, minimum_stock: 15, is_active: true, notes: "Consumo moderado.", created_at: daysAgo(12), updated_at: daysAgo(5) }
];

export const demoInventoryMovements = [
  { id: "mov1", item_id: "inv1", movement_type: "out", reason: "consumption", quantity: 5, previous_stock: 20, new_stock: 15, notes: "Consumo semanal", created_at: daysAgo(1), inventory_items: { name: "Guantes nitrilo", unit: "caja", category: "Bioseguridad" } },
  { id: "mov2", item_id: "inv2", movement_type: "out", reason: "consumption", quantity: 2, previous_stock: 10, new_stock: 8, notes: "Procedimientos quirúrgicos", created_at: daysAgo(2), inventory_items: { name: "Anestesia dental", unit: "unidad", category: "Clínico" } },
  { id: "mov3", item_id: "inv3", movement_type: "in", reason: "purchase", quantity: 12, previous_stock: 12, new_stock: 24, notes: "Compra mensual", created_at: daysAgo(3), inventory_items: { name: "Resina compuesta", unit: "unidad", category: "Restauración" } }
];


export const demoExpenseCategories: ExpenseCategory[] = [
  { id: "ec1", name: "Laboratorio", is_active: true, created_at: daysAgo(30) },
  { id: "ec2", name: "Insumos", is_active: true, created_at: daysAgo(30) },
  { id: "ec3", name: "Mantenimiento", is_active: true, created_at: daysAgo(30) },
  { id: "ec4", name: "Servicios", is_active: true, created_at: daysAgo(30) },
  { id: "ec5", name: "Marketing", is_active: true, created_at: daysAgo(30) },
  { id: "ec6", name: "Personal", is_active: true, created_at: daysAgo(30) },
  { id: "ec7", name: "Otros", is_active: true, created_at: daysAgo(30) }
];

export const demoExpenses: Expense[] = [
  { id: "ex1", category_id: "ec2", expense_date: daysAgo(1), description: "Reposición de guantes y cubrebocas", amount: 420, payment_method: "qr", notes: "Compra operativa demo", created_at: daysAgo(1), expense_categories: { name: "Insumos" } },
  { id: "ex2", category_id: "ec1", expense_date: daysAgo(3), description: "Trabajo de laboratorio externo", amount: 850, payment_method: "transfer", notes: "Caso restaurativo", created_at: daysAgo(3), expense_categories: { name: "Laboratorio" } },
  { id: "ex3", category_id: "ec4", expense_date: daysAgo(8), description: "Servicio de internet", amount: 180, payment_method: "cash", notes: null, created_at: daysAgo(8), expense_categories: { name: "Servicios" } }
];
