export type UserRole = "admin" | "reception" | "doctor";
export type PatientStatus = "new_lead" | "contacted" | "scheduled" | "attended" | "budgeted" | "in_treatment" | "inactive" | "recovery" | "finished";
export type RiskLevel = "low" | "medium" | "high";

export type ClinicSettings = {
  id: string;
  clinic_name: string;
  legal_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  timezone: string;
  tax_enabled?: boolean;
};

export type Patient = {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone: string;
  email?: string | null;
  birth_date?: string | null;
  source?: string | null;
  status: PatientStatus;
  risk_level: RiskLevel;
  notes?: string | null;
  created_at: string;
  last_contact_at?: string | null;
  active_treatment?: string | null;
  estimated_value?: number | null;
  ai_summary?: string | null;
  next_action?: string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
};

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

export type Appointment = {
  id: string;
  patient_id?: string | null;
  service_id?: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string | null;
  doctor_name?: string | null;
  room_name?: string | null;
  patients?: Pick<Patient, "full_name" | "phone"> | null;
  services?: Pick<Service, "name" | "price" | "duration_minutes"> | null;
};

export type TreatmentStatus = "pending" | "budgeted" | "approved" | "in_progress" | "finished" | "cancelled";
export type BudgetStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type PaymentStatus = "active" | "voided";
export type PaymentMethod = "cash" | "qr" | "transfer" | "card";
export type BudgetPaymentStatus = "pending" | "partial" | "paid";

export type Treatment = {
  id: string;
  patient_id: string;
  title: string;
  notes?: string | null;
  status: TreatmentStatus;
  total_amount: number;
  start_date?: string | null;
  estimated_end_date?: string | null;
  created_at: string;
  patients?: Pick<Patient, "full_name" | "phone" | "status"> | null;
  treatment_services?: TreatmentService[];
  budgets?: Budget[];
};

export type TreatmentService = {
  id: string;
  treatment_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  services?: Pick<Service, "name" | "duration_minutes" | "category"> | null;
};

export type Budget = {
  id: string;
  treatment_id: string;
  patient_id: string;
  status: BudgetStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount?: number | null;
  payment_status?: BudgetPaymentStatus | null;
  created_at: string;
  expires_at?: string | null;
  patients?: Pick<Patient, "full_name" | "phone"> | null;
  treatments?: Pick<Treatment, "title" | "status"> | null;
  budget_items?: BudgetItem[];
};

export type BudgetItem = {
  id: string;
  budget_id: string;
  service_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  services?: Pick<Service, "name" | "category"> | null;
};

export type Payment = {
  id: string;
  budget_id: string;
  patient_id: string;
  treatment_id?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string;
  notes?: string | null;
  created_at?: string | null;
  patients?: Pick<Patient, "full_name" | "phone"> | null;
  budgets?: Pick<Budget, "id" | "total_amount" | "paid_amount" | "payment_status" | "status"> | null;
  treatments?: Pick<Treatment, "title" | "status"> | null;
};

export type AutomationKind = "appointment_reminder" | "budget_followup" | "patient_recovery" | "birthday";
export type AutomationHistoryStatus = "scheduled" | "simulated" | "sent" | "failed";

export type AutomationRule = {
  id: string;
  kind: AutomationKind;
  title: string;
  description: string;
  is_enabled: boolean;
  trigger_label: string;
  timing_value: number;
  timing_unit: "hours" | "days" | "months";
  created_at?: string | null;
  updated_at?: string | null;
};

export type AutomationTemplate = {
  id: string;
  kind: AutomationKind;
  name: string;
  body: string;
  variables?: string[] | null;
  updated_at?: string | null;
};

export type AutomationHistory = {
  id: string;
  kind: AutomationKind;
  patient_name: string;
  target_label: string;
  status: AutomationHistoryStatus;
  channel: "whatsapp" | "manual" | "simulation";
  scheduled_for?: string | null;
  sent_at?: string | null;
  message_preview: string;
};

export type InventoryMovementType = "in" | "out" | "adjustment";
export type InventoryMovementReason = "purchase" | "consumption" | "loss" | "adjustment";

export type InventoryItem = {
  id: string;
  name: string;
  category?: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  inventory_movements?: InventoryMovement[];
};

export type Doctor = {
  id: string;
  full_name: string;
  specialty?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ConsultingRoom = {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InventoryMovement = {
  id: string;
  item_id: string;
  movement_type: InventoryMovementType;
  reason: InventoryMovementReason;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string | null;
  created_at: string;
  inventory_items?: Pick<InventoryItem, "name" | "unit" | "category"> | null;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string | null;
};

export type ExpensePaymentMethod = "cash" | "qr" | "transfer" | "card";

export type ExpenseStatus = "active" | "voided";

export type Expense = {
  id: string;
  category_id?: string | null;
  expense_date: string;
  description: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  status?: ExpenseStatus | null;
  voided_at?: string | null;
  void_reason?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  expense_categories?: Pick<ExpenseCategory, "name"> | null;
};
