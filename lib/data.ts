import { createSupabaseServerClient } from "@/lib/supabase-server";
import { hasSupabaseConfig } from "@/lib/supabase-config";
import { demoAppointments, demoAutomationHistory, demoAutomationRules, demoAutomationTemplates, demoConsultingRooms, demoDoctors, demoExpenseCategories, demoExpenses, demoInventoryItems, demoInventoryMovements, demoBudgets, demoClinicSettings, demoPatients, demoPayments, demoServices, demoTreatments } from "@/lib/demo-data";
import type { Appointment, AutomationHistory, AutomationRule, AutomationTemplate, Budget, ClinicSettings, ConsultingRoom, Doctor, Expense, ExpenseCategory, Patient, Payment, Service, Treatment, InventoryItem, InventoryMovement } from "@/types/database";

export async function getClinicSettings(): Promise<ClinicSettings> {
  if (!hasSupabaseConfig()) return demoClinicSettings;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clinic_settings").select("*").limit(1).single();

  if (error || !data) return demoClinicSettings;
  return data as ClinicSettings;
}

export async function getPatients(): Promise<Patient[]> {
  if (!hasSupabaseConfig()) return demoPatients;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(100);

  if (error || !data) return demoPatients;
  return data as Patient[];
}

export async function getServices(): Promise<Service[]> {
  if (!hasSupabaseConfig()) return demoServices;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("services").select("*").order("name");

  if (error || !data) return demoServices;
  return data as Service[];
}

export async function getActiveServices(): Promise<Service[]> {
  const services = await getServices();
  return services.filter((service) => service.is_active);
}

export async function getDoctors(): Promise<Doctor[]> {
  if (!hasSupabaseConfig()) return demoDoctors as Doctor[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("id, full_name, specialty, email, phone, is_active, notes, created_at, updated_at")
    .order("full_name", { ascending: true });

  if (error || !data) return demoDoctors as Doctor[];
  return data as Doctor[];
}

export async function getActiveDoctors(): Promise<Doctor[]> {
  const doctors = await getDoctors();
  return doctors.filter((doctor) => doctor.is_active);
}

export async function getConsultingRooms(): Promise<ConsultingRoom[]> {
  if (!hasSupabaseConfig()) return demoConsultingRooms as ConsultingRoom[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consulting_rooms")
    .select("id, name, description, is_active, notes, created_at, updated_at")
    .order("name", { ascending: true });

  if (error || !data) return demoConsultingRooms as ConsultingRoom[];
  return data as ConsultingRoom[];
}

export async function getActiveConsultingRooms(): Promise<ConsultingRoom[]> {
  const rooms = await getConsultingRooms();
  return rooms.filter((room) => room.is_active);
}

export async function getAppointments(): Promise<Appointment[]> {
  if (!hasSupabaseConfig()) return demoAppointments;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, service_id, starts_at, ends_at, status, notes, doctor_name, room_name, patients(full_name, phone), services(name, price, duration_minutes)")
    .order("starts_at", { ascending: true })
    .limit(100);

  if (error || !data) return demoAppointments;
  return data as unknown as Appointment[];
}


export async function getTreatments(): Promise<Treatment[]> {
  if (!hasSupabaseConfig()) return demoTreatments;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("id, patient_id, title, notes, status, total_amount, start_date, estimated_end_date, created_at, patients(full_name, phone, status), treatment_services(id, treatment_id, service_id, quantity, unit_price, total_price, services(name, duration_minutes, category)), budgets(id, treatment_id, patient_id, status, subtotal_amount, discount_amount, total_amount, paid_amount, payment_status, created_at, expires_at)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return demoTreatments;
  return data as unknown as Treatment[];
}

export async function getBudgets(): Promise<Budget[]> {
  if (!hasSupabaseConfig()) return demoBudgets;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, treatment_id, patient_id, status, subtotal_amount, discount_amount, total_amount, paid_amount, payment_status, created_at, expires_at, patients(full_name, phone), treatments(title, status), budget_items(id, budget_id, service_id, description, quantity, unit_price, total_price, services(name, category))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return demoBudgets;
  return data as unknown as Budget[];
}


export async function getPayments(): Promise<Payment[]> {
  if (!hasSupabaseConfig()) return demoPayments;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, budget_id, patient_id, treatment_id, amount, method, status, paid_at, notes, created_at, patients(full_name, phone), budgets(id, total_amount, paid_amount, payment_status, status), treatments(title, status)")
    .order("paid_at", { ascending: false })
    .limit(150);

  if (error || !data) return demoPayments;
  return data as unknown as Payment[];
}


export async function getAutomationRules(): Promise<AutomationRule[]> {
  if (!hasSupabaseConfig()) return demoAutomationRules as unknown as AutomationRule[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("automation_rules").select("*").order("created_at", { ascending: true });

  if (error || !data) return demoAutomationRules as unknown as AutomationRule[];
  return data as AutomationRule[];
}

export async function getAutomationTemplates(): Promise<AutomationTemplate[]> {
  if (!hasSupabaseConfig()) return demoAutomationTemplates as unknown as AutomationTemplate[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("automation_templates").select("*").order("name", { ascending: true });

  if (error || !data) return demoAutomationTemplates as unknown as AutomationTemplate[];
  return data as AutomationTemplate[];
}

export async function getAutomationHistory(): Promise<AutomationHistory[]> {
  if (!hasSupabaseConfig()) return demoAutomationHistory as unknown as AutomationHistory[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("automation_history").select("*").order("scheduled_for", { ascending: true }).limit(100);

  if (error || !data) return demoAutomationHistory as unknown as AutomationHistory[];
  return data as AutomationHistory[];
}


export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!hasSupabaseConfig()) return demoInventoryItems as unknown as InventoryItem[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, name, category, unit, current_stock, minimum_stock, is_active, notes, created_at, updated_at")
    .order("name", { ascending: true });

  if (error || !data) return demoInventoryItems as unknown as InventoryItem[];
  return data as InventoryItem[];
}

export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  if (!hasSupabaseConfig()) return demoInventoryMovements as unknown as InventoryMovement[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("id, item_id, movement_type, reason, quantity, previous_stock, new_stock, notes, created_at, inventory_items(name, unit, category)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error || !data) return demoInventoryMovements as unknown as InventoryMovement[];
  return data as unknown as InventoryMovement[];
}


export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  if (!hasSupabaseConfig()) return demoExpenseCategories as ExpenseCategory[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name, is_active, created_at")
    .order("name", { ascending: true });

  if (error || !data) return demoExpenseCategories as ExpenseCategory[];
  return data as ExpenseCategory[];
}

export async function getExpenses(): Promise<Expense[]> {
  if (!hasSupabaseConfig()) return demoExpenses as Expense[];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category_id, expense_date, description, amount, payment_method, status, voided_at, void_reason, notes, created_at, updated_at, expense_categories(name)")
    .order("expense_date", { ascending: false })
    .limit(200);

  if (error || !data) return demoExpenses as unknown as Expense[];
  return data as unknown as Expense[];
}
