"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { Toast, useToast } from "@/components/ui/toast";
import { StatusPill } from "@/components/ui/status-pill";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { OperationalKpi } from "@/components/ui/operational-kpi";
import { formatMoney } from "@/lib/currency";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  Budget,
  BudgetStatus,
  ClinicSettings,
  Patient,
  Service,
  Treatment,
  TreatmentStatus,
} from "@/types/database";

const treatmentLabels: Record<TreatmentStatus, string> = {
  pending: "Pendiente",
  budgeted: "Presupuestado",
  approved: "Aprobado",
  in_progress: "En ejecución",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const budgetLabels: Record<BudgetStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
};

const editableTreatmentStatuses: TreatmentStatus[] = ["pending", "budgeted"];
const readonlyTreatmentStatuses: TreatmentStatus[] = [
  "approved",
  "in_progress",
  "finished",
  "cancelled",
];
const editableBudgetStatuses: BudgetStatus[] = ["draft", "sent"];

function pillVariant(status: string) {
  if (["approved", "in_progress", "finished"].includes(status))
    return "success" as const;
  if (["sent", "budgeted", "pending", "draft"].includes(status))
    return "warning" as const;
  if (["rejected", "cancelled", "expired"].includes(status))
    return "danger" as const;
  return "neutral" as const;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Props = {
  settings: ClinicSettings;
  patients: Patient[];
  services: Service[];
  treatments: Treatment[];
  budgets: Budget[];
  mode?: "app" | "demo";
};

function BudgetDetail({
  budget,
  settings,
  isDemo,
  onSend,
  onApprove,
  onReject,
  onRegisterPayment,
}: {
  budget: Budget;
  settings: ClinicSettings;
  isDemo: boolean;
  onSend: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRegisterPayment: () => void;
}) {
  const canSend = budget.status === "draft";
  const canDecide = budget.status === "draft" || budget.status === "sent";
  const canPay = budget.status === "approved";

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Detalle del presupuesto
          </p>
          <div className="mt-3 grid gap-2">
            {(budget.budget_items || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
              >
                <span className="text-muted">
                  {item.description || item.services?.name || "Servicio"}
                </span>
                <strong className="text-ink">
                  {formatMoney(Number(item.total_price), settings)}
                </strong>
              </div>
            ))}
            {(budget.budget_items || []).length === 0 ? (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-muted">
                Sin servicios registrados.
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-sm xl:min-w-56">
          <p className="flex justify-between gap-4 text-muted">
            <span>Subtotal</span>
            <strong className="text-ink">
              {formatMoney(Number(budget.subtotal_amount), settings)}
            </strong>
          </p>
          <p className="mt-1 flex justify-between gap-4 text-muted">
            <span>Descuento</span>
            <strong className="text-ink">
              {formatMoney(Number(budget.discount_amount), settings)}
            </strong>
          </p>
          <p className="mt-3 flex justify-between gap-4 text-lg font-black text-ink">
            <span>Total</span>
            <span>{formatMoney(Number(budget.total_amount), settings)}</span>
          </p>
          {budget.payment_status ? (
            <p className="mt-2 text-xs font-bold text-muted">
              Pago:{" "}
              {budget.payment_status === "paid"
                ? "Pagado"
                : budget.payment_status === "partial"
                  ? "Parcial"
                  : "Pendiente"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {canSend ? (
          <button
            type="button"
            onClick={onSend}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-muted hover:text-primary"
          >
            <Send size={14} className="inline-block align-[-2px]" /> Enviar
          </button>
        ) : null}
        {canDecide ? (
          <button
            type="button"
            onClick={onApprove}
            className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700"
          >
            <CheckCircle2 size={14} className="inline-block align-[-2px]" />{" "}
            Aprobar
          </button>
        ) : null}
        {canDecide ? (
          <button
            type="button"
            onClick={onReject}
            className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600"
          >
            <XCircle size={14} className="inline-block align-[-2px]" /> Rechazar
          </button>
        ) : null}
        {canPay ? (
          <button
            type="button"
            onClick={onRegisterPayment}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-primary"
          >
            <FileText size={14} className="inline-block align-[-2px]" />{" "}
            Registrar pago
          </button>
        ) : null}
        {!canSend && !canDecide && !canPay ? (
          <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-muted">
            Solo lectura
          </p>
        ) : null}
        {isDemo ? (
          <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-primary">
            Demo · solo lectura
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TreatmentBudgetManager({
  settings,
  patients,
  services,
  treatments,
  budgets,
  mode = "app",
}: Props) {
  const router = useRouter();
  const isDemo = mode === "demo";
  const { toast, showToast, closeToast } = useToast();
  const activePatients = patients.filter(
    (patient) => patient.is_active !== false,
  );
  const activeServices = services.filter((service) => service.is_active);

  const [patientId, setPatientId] = useState(activePatients[0]?.id || "");
  const [patientSearch, setPatientSearch] = useState("");
  const [title, setTitle] = useState("Plan dental inicial");
  const [notes, setNotes] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>(
    activeServices[0] ? [activeServices[0].id] : [],
  );
  const [discount, setDiscount] = useState("0");
  const [saving, setSaving] = useState(false);

  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editEstimatedEndDate, setEditEstimatedEndDate] = useState("");
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [expandedTreatmentId, setExpandedTreatmentId] = useState<string | null>(
    null,
  );
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<
    "all" | TreatmentStatus
  >("all");
  const [budgetSearch, setBudgetSearch] = useState("");
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<
    "all" | BudgetStatus
  >("all");
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [treatmentPage, setTreatmentPage] = useState(1);
  const [budgetPage, setBudgetPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);

  const filteredPatients = useMemo(() => {
    const query = normalizeText(patientSearch.trim());
    if (!query) return activePatients.slice(0, 8);
    return activePatients
      .filter((patient) =>
        normalizeText(
          `${patient.full_name} ${patient.phone} ${patient.email || ""}`,
        ).includes(query),
      )
      .slice(0, 8);
  }, [activePatients, patientSearch]);

  const selectedPatient = activePatients.find(
    (patient) => patient.id === patientId,
  );
  const selectedServices = useMemo(
    () => activeServices.filter((service) => serviceIds.includes(service.id)),
    [activeServices, serviceIds],
  );
  const subtotal = selectedServices.reduce(
    (sum, service) => sum + Number(service.price || 0),
    0,
  );
  const discountAmount = Math.max(0, Number(discount || 0));
  const total = Math.max(0, subtotal - discountAmount);

  const editingTreatment = treatments.find(
    (treatment) => treatment.id === editingTreatmentId,
  );
  const editSelectedServices = activeServices.filter((service) =>
    editServiceIds.includes(service.id),
  );
  const editTotal = editSelectedServices.reduce(
    (sum, service) => sum + Number(service.price || 0),
    0,
  );

  const filteredTreatments = useMemo(() => {
    const query = normalizeText(treatmentSearch.trim());
    return [...treatments]
      .filter(
        (treatment) =>
          treatmentStatusFilter === "all" ||
          treatment.status === treatmentStatusFilter,
      )
      .filter((treatment) => {
        if (!query) return true;
        const serviceNames = (treatment.treatment_services || [])
          .map((item) => item.services?.name || "")
          .join(" ");
        return normalizeText(
          `${treatment.title} ${treatment.patients?.full_name || ""} ${treatment.patients?.phone || ""} ${treatment.status} ${serviceNames}`,
        ).includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [treatments, treatmentSearch, treatmentStatusFilter]);

  const treatmentCounters = useMemo(() => {
    return treatments.reduce<Record<TreatmentStatus, number>>(
      (acc, treatment) => {
        acc[treatment.status] += 1;
        return acc;
      },
      {
        pending: 0,
        budgeted: 0,
        approved: 0,
        in_progress: 0,
        finished: 0,
        cancelled: 0,
      },
    );
  }, [treatments]);

  const filteredBudgets = useMemo(() => {
    const query = normalizeText(budgetSearch.trim());
    return [...budgets]
      .filter(
        (budget) =>
          budgetStatusFilter === "all" || budget.status === budgetStatusFilter,
      )
      .filter((budget) => {
        if (!query) return true;
        const servicesText = (budget.budget_items || [])
          .map((item) => item.description || item.services?.name || "")
          .join(" ");
        return normalizeText(
          `${budget.patients?.full_name || ""} ${budget.patients?.phone || ""} ${budget.treatments?.title || ""} ${budget.status} ${servicesText}`,
        ).includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [budgets, budgetSearch, budgetStatusFilter]);

  const budgetCounters = useMemo(() => {
    return budgets.reduce<Record<BudgetStatus, number>>(
      (acc, budget) => {
        acc[budget.status] += 1;
        return acc;
      },
      { draft: 0, sent: 0, approved: 0, rejected: 0, expired: 0 },
    );
  }, [budgets]);

  const paginatedTreatments = useMemo(() => {
    const start = (treatmentPage - 1) * listPageSize;
    return filteredTreatments.slice(start, start + listPageSize);
  }, [filteredTreatments, treatmentPage, listPageSize]);

  const paginatedBudgets = useMemo(() => {
    const start = (budgetPage - 1) * listPageSize;
    return filteredBudgets.slice(start, start + listPageSize);
  }, [filteredBudgets, budgetPage, listPageSize]);

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleEditService(id: string) {
    setEditServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function startEditTreatment(treatment: Treatment) {
    if (!editableTreatmentStatuses.includes(treatment.status)) {
      showToast(
        "warning",
        "Tratamiento solo lectura",
        "Solo puedes editar tratamientos pendientes o presupuestados.",
      );
      return;
    }
    setEditingTreatmentId(treatment.id);
    setEditTitle(treatment.title);
    setEditNotes(treatment.notes || "");
    setEditEstimatedEndDate(treatment.estimated_end_date || "");
    setEditServiceIds(
      (treatment.treatment_services || []).map((item) => item.service_id),
    );
    setExpandedTreatmentId(treatment.id);
  }

  function cancelEditTreatment() {
    setEditingTreatmentId(null);
    setEditTitle("");
    setEditNotes("");
    setEditEstimatedEndDate("");
    setEditServiceIds([]);
  }

  async function createTreatment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para crear tratamientos reales.",
      );
    if (!patientId || selectedServices.length === 0)
      return showToast(
        "warning",
        "Faltan datos",
        "Selecciona paciente y al menos un servicio.",
      );
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: treatment, error: treatmentError } = await supabase
        .from("treatments")
        .insert({
          patient_id: patientId,
          title: title.trim(),
          notes: notes || null,
          status: "budgeted",
          total_amount: total,
          start_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      if (treatmentError) throw treatmentError;

      const treatmentItems = selectedServices.map((service) => ({
        treatment_id: treatment.id,
        service_id: service.id,
        quantity: 1,
        unit_price: Number(service.price || 0),
        total_price: Number(service.price || 0),
      }));
      const { error: itemError } = await supabase
        .from("treatment_services")
        .insert(treatmentItems);
      if (itemError) throw itemError;

      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          patient_id: patientId,
          treatment_id: treatment.id,
          status: "sent",
          subtotal_amount: subtotal,
          discount_amount: discountAmount,
          total_amount: total,
          expires_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .select("id")
        .single();
      if (budgetError) throw budgetError;

      const budgetItems = selectedServices.map((service) => ({
        budget_id: budget.id,
        service_id: service.id,
        description: service.name,
        quantity: 1,
        unit_price: Number(service.price || 0),
        total_price: Number(service.price || 0),
      }));
      const { error: budgetItemError } = await supabase
        .from("budget_items")
        .insert(budgetItems);
      if (budgetItemError) throw budgetItemError;

      await supabase
        .from("patients")
        .update({
          status: "budgeted",
          active_treatment: title.trim(),
          estimated_value: total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patientId);

      setTitle("Plan dental inicial");
      setNotes("");
      setDiscount("0");
      setServiceIds(activeServices[0] ? [activeServices[0].id] : []);
      showToast(
        "success",
        "Tratamiento y presupuesto creados",
        "El paciente pasó a Presupuestado en el CRM.",
      );
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo crear",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveTreatmentEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para editar tratamientos reales.",
      );
    if (!editingTreatment) return;
    if (!editableTreatmentStatuses.includes(editingTreatment.status)) {
      showToast(
        "warning",
        "Tratamiento bloqueado",
        "Este tratamiento ya no puede modificarse por su estado actual.",
      );
      return;
    }
    if (editServiceIds.length === 0) {
      showToast(
        "warning",
        "Faltan servicios",
        "Selecciona al menos un servicio para el tratamiento.",
      );
      return;
    }

    setEditing(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: latestTreatment, error: latestError } = await supabase
        .from("treatments")
        .select("status")
        .eq("id", editingTreatment.id)
        .single();
      if (latestError) throw latestError;
      if (
        !editableTreatmentStatuses.includes(
          latestTreatment.status as TreatmentStatus,
        )
      ) {
        showToast(
          "warning",
          "Tratamiento bloqueado",
          "El tratamiento cambió de estado y ya no puede editarse.",
        );
        router.refresh();
        return;
      }

      const { error: treatmentError } = await supabase
        .from("treatments")
        .update({
          title: editTitle.trim(),
          notes: editNotes || null,
          estimated_end_date: editEstimatedEndDate || null,
          total_amount: editTotal,
        })
        .eq("id", editingTreatment.id);
      if (treatmentError) throw treatmentError;

      const { error: deleteError } = await supabase
        .from("treatment_services")
        .delete()
        .eq("treatment_id", editingTreatment.id);
      if (deleteError) throw deleteError;

      const newItems = editSelectedServices.map((service) => ({
        treatment_id: editingTreatment.id,
        service_id: service.id,
        quantity: 1,
        unit_price: Number(service.price || 0),
        total_price: Number(service.price || 0),
      }));
      const { error: insertError } = await supabase
        .from("treatment_services")
        .insert(newItems);
      if (insertError) throw insertError;

      const { data: relatedBudgets, error: budgetsError } = await supabase
        .from("budgets")
        .select("id,status,paid_amount,payment_status")
        .eq("treatment_id", editingTreatment.id);
      if (budgetsError) throw budgetsError;

      const editableBudgets = (relatedBudgets || []).filter((budget) =>
        editableBudgetStatuses.includes(budget.status as BudgetStatus),
      );
      for (const budget of editableBudgets) {
        const { error: deleteBudgetItemsError } = await supabase
          .from("budget_items")
          .delete()
          .eq("budget_id", budget.id);
        if (deleteBudgetItemsError) throw deleteBudgetItemsError;

        const syncedBudgetItems = editSelectedServices.map((service) => ({
          budget_id: budget.id,
          service_id: service.id,
          description: service.name,
          quantity: 1,
          unit_price: Number(service.price || 0),
          total_price: Number(service.price || 0),
        }));
        const { error: insertBudgetItemsError } = await supabase
          .from("budget_items")
          .insert(syncedBudgetItems);
        if (insertBudgetItemsError) throw insertBudgetItemsError;

        const paidAmount = Number(budget.paid_amount || 0);
        const nextPaymentStatus =
          paidAmount <= 0
            ? "pending"
            : paidAmount >= editTotal
              ? "paid"
              : "partial";
        const { error: updateBudgetError } = await supabase
          .from("budgets")
          .update({
            subtotal_amount: editTotal,
            discount_amount: 0,
            total_amount: editTotal,
            payment_status: nextPaymentStatus,
          })
          .eq("id", budget.id);
        if (updateBudgetError) throw updateBudgetError;
      }

      await supabase
        .from("patients")
        .update({
          active_treatment: editTitle.trim(),
          estimated_value: editTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTreatment.patient_id);

      const syncMessage =
        editableBudgets.length > 0
          ? "Los servicios, el total y el presupuesto asociado fueron recalculados."
          : "Los servicios y el total fueron recalculados. Los presupuestos cerrados no se modifican.";
      showToast("success", "Tratamiento actualizado", syncMessage);
      cancelEditTreatment();
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo guardar",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    } finally {
      setEditing(false);
    }
  }

  async function updateBudgetStatus(budget: Budget, nextStatus: BudgetStatus) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para cambiar presupuestos reales.",
      );
    if (!editableBudgetStatuses.includes(budget.status))
      return showToast(
        "warning",
        "Presupuesto bloqueado",
        "Solo puedes modificar presupuestos en Borrador o Enviado.",
      );
    closeToast();
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("budgets")
        .update({ status: nextStatus })
        .eq("id", budget.id);
      if (error) throw error;

      if (nextStatus === "approved") {
        await supabase
          .from("treatments")
          .update({ status: "in_progress" })
          .eq("id", budget.treatment_id);
        await supabase
          .from("patients")
          .update({
            status: "in_treatment",
            estimated_value: budget.total_amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", budget.patient_id);
      }
      if (nextStatus === "rejected") {
        await supabase
          .from("patients")
          .update({ status: "recovery", updated_at: new Date().toISOString() })
          .eq("id", budget.patient_id);
      }

      showToast(
        nextStatus === "approved" ? "success" : "warning",
        nextStatus === "approved"
          ? "Presupuesto aprobado"
          : "Presupuesto rechazado",
        nextStatus === "approved"
          ? "El paciente pasó a En tratamiento."
          : "El paciente pasó a Recuperación.",
      );
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo cambiar el estado",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    }
  }

  async function updateTreatmentStatus(
    treatment: Treatment,
    nextStatus: TreatmentStatus,
  ) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para cambiar tratamientos reales.",
      );
    closeToast();
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("treatments")
        .update({ status: nextStatus })
        .eq("id", treatment.id);
      if (error) throw error;
      if (nextStatus === "finished")
        await supabase
          .from("patients")
          .update({ status: "finished", updated_at: new Date().toISOString() })
          .eq("id", treatment.patient_id);
      if (nextStatus === "cancelled")
        await supabase
          .from("patients")
          .update({ status: "recovery", updated_at: new Date().toISOString() })
          .eq("id", treatment.patient_id);
      showToast(
        "success",
        "Tratamiento actualizado",
        nextStatus === "finished"
          ? "El paciente pasó a Finalizado."
          : "El estado fue actualizado correctamente.",
      );
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        "No se pudo actualizar",
        error instanceof Error ? error.message : "Intenta nuevamente.",
      );
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <Toast toast={toast} onClose={closeToast} />
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={createTreatment} className="card p-5">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            <h2 className="font-bold text-ink">
              Nuevo tratamiento con presupuesto
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Busca al paciente, selecciona servicios y el presupuesto se calcula
            automáticamente.
          </p>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2 text-sm font-semibold text-ink">
              <span>Paciente</span>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-muted">
                  <Search size={16} />
                  <input
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Buscar por nombre, teléfono o correo"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {filteredPatients.map((patient) => (
                    <button
                      type="button"
                      key={patient.id}
                      onClick={() => setPatientId(patient.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${patientId === patient.id ? "border-primary bg-blue-50 text-primary" : "border-slate-100 bg-white text-muted hover:border-slate-200"}`}
                    >
                      <span className="block font-bold">
                        {patient.full_name}
                      </span>
                      <span>
                        {patient.phone}
                        {patient.email ? ` · ${patient.email}` : ""}
                      </span>
                    </button>
                  ))}
                  {filteredPatients.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">
                      No se encontraron pacientes con esa búsqueda.
                    </p>
                  ) : null}
                </div>
              </div>
              {selectedPatient ? (
                <p className="text-xs font-medium text-muted">
                  Seleccionado:{" "}
                  <span className="text-ink">{selectedPatient.full_name}</span>
                </p>
              ) : null}
            </div>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Nombre del tratamiento
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">
                Servicios incluidos
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeServices.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`rounded-2xl border p-3 text-left text-sm transition ${serviceIds.includes(service.id) ? "border-primary bg-blue-50 text-primary" : "border-slate-200 bg-white text-muted"}`}
                  >
                    <span className="block font-bold">{service.name}</span>
                    <span>
                      {formatMoney(Number(service.price), settings)} ·{" "}
                      {service.duration_minutes} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-ink">
                Descuento ({settings.currency_symbol})
                <input
                  type="number"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                />
              </label>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="text-muted">
                  Subtotal:{" "}
                  <strong className="text-ink">
                    {formatMoney(subtotal, settings)}
                  </strong>
                </p>
                <p className="text-muted">
                  Descuento:{" "}
                  <strong className="text-ink">
                    {formatMoney(discountAmount, settings)}
                  </strong>
                </p>
                <p className="mt-1 text-lg font-black text-ink">
                  Total: {formatMoney(total, settings)}
                </p>
              </div>
            </div>
            <label className="space-y-2 text-sm font-semibold text-ink">
              Observaciones
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
              />
            </label>
          </div>
          <button
            disabled={saving}
            className="btn-primary mt-5 disabled:bg-slate-300"
          >
            {saving ? "Guardando..." : "Crear tratamiento y presupuesto"}
          </button>
        </form>

        <div className="card p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-bold text-ink">Presupuestos</h2>
              <p className="mt-1 text-sm text-muted">
                Lista compacta para revisar, buscar y gestionar presupuestos sin
                saturar la pantalla.
              </p>
            </div>
            <StatusPill
              label={`${filteredBudgets.length} visibles`}
              variant="neutral"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={budgetSearch}
              onChange={(value) => {
                setBudgetSearch(value);
                setBudgetPage(1);
              }}
              placeholder="Buscar paciente o tratamiento"
              className="min-w-0 flex-1"
            />
            <select
              value={budgetStatusFilter}
              onChange={(event) =>
                setBudgetStatusFilter(
                  event.target.value as "all" | BudgetStatus,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-muted outline-none"
            >
              <option value="all">Todos</option>
              <option value="draft">Borrador ({budgetCounters.draft})</option>
              <option value="sent">Enviado ({budgetCounters.sent})</option>
              <option value="approved">
                Aprobado ({budgetCounters.approved})
              </option>
              <option value="rejected">
                Rechazado ({budgetCounters.rejected})
              </option>
              <option value="expired">
                Vencido ({budgetCounters.expired})
              </option>
            </select>
          </div>

          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 lg:block">
            <div className="grid grid-cols-[1.1fr_1.2fr_0.7fr_0.7fr_0.7fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
              <span>Paciente</span>
              <span>Tratamiento</span>
              <span>Total</span>
              <span>Estado</span>
              <span>Fecha</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {paginatedBudgets.map((budget) => {
                const isExpanded = expandedBudgetId === budget.id;
                return (
                  <div key={budget.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBudgetId(isExpanded ? null : budget.id)
                      }
                      className="grid w-full grid-cols-[1.1fr_1.2fr_0.7fr_0.7fr_0.7fr] items-center gap-4 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-ink">
                          {budget.patients?.full_name || "Paciente"}
                        </p>
                        <p className="text-xs text-muted">
                          {budget.patients?.phone || "Sin teléfono"}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-ink">
                          {budget.treatments?.title || "Tratamiento"}
                        </p>
                        <p className="text-xs text-muted">
                          Click para ver detalle
                        </p>
                      </div>
                      <p className="font-black text-ink">
                        {formatMoney(Number(budget.total_amount), settings)}
                      </p>
                      <StatusPill
                        label={budgetLabels[budget.status]}
                        variant={pillVariant(budget.status)}
                      />
                      <p className="text-sm text-muted">
                        {new Date(budget.created_at).toLocaleDateString(
                          settings.locale || "es-BO",
                        )}
                      </p>
                    </button>
                    {isExpanded ? (
                      <BudgetDetail
                        budget={budget}
                        settings={settings}
                        isDemo={isDemo}
                        onSend={() => void updateBudgetStatus(budget, "sent")}
                        onApprove={() =>
                          void updateBudgetStatus(budget, "approved")
                        }
                        onReject={() =>
                          void updateBudgetStatus(budget, "rejected")
                        }
                        onRegisterPayment={() =>
                          isDemo
                            ? showToast(
                                "info",
                                "Demo en solo lectura",
                                "Ingresa al sistema para registrar pagos reales.",
                              )
                            : router.push("/payments")
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-3 lg:hidden">
            {paginatedBudgets.map((budget) => {
              const isExpanded = expandedBudgetId === budget.id;
              return (
                <article
                  key={budget.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedBudgetId(isExpanded ? null : budget.id)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">
                          {budget.patients?.full_name || "Paciente"}
                        </p>
                        <p className="text-sm text-muted">
                          {budget.treatments?.title || "Tratamiento"}
                        </p>
                        <p className="mt-2 text-lg font-black text-ink">
                          {formatMoney(Number(budget.total_amount), settings)}
                        </p>
                      </div>
                      <StatusPill
                        label={budgetLabels[budget.status]}
                        variant={pillVariant(budget.status)}
                      />
                    </div>
                  </button>
                  {isExpanded ? (
                    <BudgetDetail
                      budget={budget}
                      settings={settings}
                      isDemo={isDemo}
                      onSend={() => void updateBudgetStatus(budget, "sent")}
                      onApprove={() =>
                        void updateBudgetStatus(budget, "approved")
                      }
                      onReject={() =>
                        void updateBudgetStatus(budget, "rejected")
                      }
                      onRegisterPayment={() =>
                        isDemo
                          ? showToast(
                              "info",
                              "Demo en solo lectura",
                              "Ingresa al sistema para registrar pagos reales.",
                            )
                          : router.push("/payments")
                      }
                    />
                  ) : null}
                </article>
              );
            })}
          </div>

          {filteredBudgets.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
              No hay presupuestos para esta búsqueda o filtro.
            </p>
          ) : null}
          <PaginationControls
            page={budgetPage}
            pageSize={listPageSize}
            totalItems={filteredBudgets.length}
            onPageChange={setBudgetPage}
            onPageSizeChange={setListPageSize}
            className="mt-5"
          />
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Tratamientos</h2>
            <p className="mt-1 text-sm text-muted">
              Lista compacta para revisar, filtrar y editar planes sin saturar
              la pantalla.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={treatmentSearch}
              onChange={(value) => {
                setTreatmentSearch(value);
                setTreatmentPage(1);
              }}
              placeholder="Buscar tratamiento o paciente"
              className="min-w-[260px]"
            />
            <select
              value={treatmentStatusFilter}
              onChange={(event) =>
                setTreatmentStatusFilter(
                  event.target.value as "all" | TreatmentStatus,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-muted outline-none"
            >
              <option value="all">Todos</option>
              <option value="pending">
                Pendiente ({treatmentCounters.pending})
              </option>
              <option value="budgeted">
                Presupuestado ({treatmentCounters.budgeted})
              </option>
              <option value="approved">
                Aprobado ({treatmentCounters.approved})
              </option>
              <option value="in_progress">
                En ejecución ({treatmentCounters.in_progress})
              </option>
              <option value="finished">
                Finalizado ({treatmentCounters.finished})
              </option>
              <option value="cancelled">
                Cancelado ({treatmentCounters.cancelled})
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <OperationalKpi
            label="Total"
            value={treatments.length}
            help="Tratamientos"
          />
          <OperationalKpi
            label="Presupuestados"
            value={treatmentCounters.budgeted}
            help="En evaluación"
            tone="warning"
          />
          <OperationalKpi
            label="En ejecución"
            value={treatmentCounters.in_progress}
            help="Activos"
            tone="primary"
          />
          <OperationalKpi
            label="Finalizados"
            value={treatmentCounters.finished}
            help="Cerrados"
            tone="success"
          />
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-100 lg:block">
          <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr_0.9fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
            <span>Paciente</span>
            <span>Tratamiento</span>
            <span>Estado</span>
            <span>Total</span>
            <span className="text-right">Acciones</span>
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            {paginatedTreatments.map((treatment) => {
              const canEdit = editableTreatmentStatuses.includes(
                treatment.status,
              );
              const isEditing = editingTreatmentId === treatment.id;
              const isExpanded =
                expandedTreatmentId === treatment.id || isEditing;
              const servicesSummary = (treatment.treatment_services || [])
                .map((item) => item.services?.name || "Servicio")
                .join(", ");
              return (
                <div key={treatment.id} className="px-4 py-3">
                  <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr_0.9fr] items-center gap-4">
                    <div>
                      <p className="font-bold text-ink">
                        {treatment.patients?.full_name || "Paciente"}
                      </p>
                      <p className="text-xs text-muted">
                        {treatment.patients?.phone || "Sin teléfono"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTreatmentId(isExpanded ? null : treatment.id)
                      }
                      className="text-left"
                    >
                      <p className="font-bold text-ink">{treatment.title}</p>
                      <p className="line-clamp-1 text-xs text-muted">
                        {servicesSummary || "Sin servicios"}
                      </p>
                    </button>
                    <StatusPill
                      label={treatmentLabels[treatment.status]}
                      variant={pillVariant(treatment.status)}
                    />
                    <p className="font-black text-ink">
                      {formatMoney(Number(treatment.total_amount), settings)}
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTreatmentId(
                            isExpanded ? null : treatment.id,
                          )
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted hover:text-primary"
                      >
                        Detalle
                      </button>
                      <button
                        disabled={!canEdit}
                        onClick={() => startEditTreatment(treatment)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil
                          size={14}
                          className="inline-block align-[-2px]"
                        />{" "}
                        Editar
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      {isEditing ? (
                        <form
                          onSubmit={saveTreatmentEdit}
                          className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-ink">
                              Editar tratamiento
                            </p>
                            <button
                              type="button"
                              onClick={cancelEditTreatment}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-muted"
                            >
                              <X size={15} />
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3">
                            <label className="space-y-2 text-sm font-semibold text-ink">
                              Nombre
                              <input
                                value={editTitle}
                                onChange={(event) =>
                                  setEditTitle(event.target.value)
                                }
                                required
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                              />
                            </label>
                            <label className="space-y-2 text-sm font-semibold text-ink">
                              Fecha estimada de cierre
                              <input
                                type="date"
                                value={editEstimatedEndDate}
                                onChange={(event) =>
                                  setEditEstimatedEndDate(event.target.value)
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                              />
                            </label>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-ink">
                                Servicios
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {activeServices.map((service) => (
                                  <button
                                    type="button"
                                    key={service.id}
                                    onClick={() =>
                                      toggleEditService(service.id)
                                    }
                                    className={`rounded-2xl border p-3 text-left text-sm transition ${editServiceIds.includes(service.id) ? "border-primary bg-white text-primary" : "border-slate-200 bg-white text-muted"}`}
                                  >
                                    <span className="block font-bold">
                                      {service.name}
                                    </span>
                                    <span>
                                      {formatMoney(
                                        Number(service.price),
                                        settings,
                                      )}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-white p-4 text-right text-lg font-black text-ink">
                              Nuevo total: {formatMoney(editTotal, settings)}
                            </div>
                            <label className="space-y-2 text-sm font-semibold text-ink">
                              Observaciones
                              <textarea
                                value={editNotes}
                                onChange={(event) =>
                                  setEditNotes(event.target.value)
                                }
                                rows={3}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                              />
                            </label>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              disabled={editing}
                              className="btn-primary disabled:bg-slate-300"
                            >
                              {editing ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditTreatment}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-muted"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Servicios
                              </p>
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {(treatment.treatment_services || []).map(
                                  (item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                                    >
                                      <span className="text-muted">
                                        {item.services?.name || "Servicio"}
                                      </span>
                                      <strong className="text-ink">
                                        {formatMoney(
                                          Number(item.total_price),
                                          settings,
                                        )}
                                      </strong>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-white p-4 text-right">
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Total
                              </p>
                              <p className="text-xl font-black text-ink">
                                {formatMoney(
                                  Number(treatment.total_amount),
                                  settings,
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                void updateTreatmentStatus(
                                  treatment,
                                  "in_progress",
                                )
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted hover:text-primary"
                            >
                              En ejecución
                            </button>
                            <button
                              onClick={() =>
                                void updateTreatmentStatus(
                                  treatment,
                                  "finished",
                                )
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted hover:text-primary"
                            >
                              Finalizar
                            </button>
                            <button
                              onClick={() =>
                                void updateTreatmentStatus(
                                  treatment,
                                  "cancelled",
                                )
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted hover:text-red-600"
                            >
                              Cancelar
                            </button>
                          </div>
                          {!canEdit ? (
                            <p className="mt-3 text-xs text-muted">
                              Este tratamiento ya está bloqueado para edición.
                              Para cambios futuros se creará una nueva versión
                              del plan.
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-3 lg:hidden">
          {paginatedTreatments.map((treatment) => {
            const canEdit = editableTreatmentStatuses.includes(
              treatment.status,
            );
            const isEditing = editingTreatmentId === treatment.id;
            const isExpanded =
              expandedTreatmentId === treatment.id || isEditing;
            return (
              <article
                key={treatment.id}
                className="rounded-2xl border border-slate-100 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {treatment.patients?.full_name || "Paciente"}
                    </p>
                    <h3 className="mt-1 font-bold text-ink">
                      {treatment.title}
                    </h3>
                    <p className="mt-1 text-sm font-black text-ink">
                      {formatMoney(Number(treatment.total_amount), settings)}
                    </p>
                  </div>
                  <StatusPill
                    label={treatmentLabels[treatment.status]}
                    variant={pillVariant(treatment.status)}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTreatmentId(isExpanded ? null : treatment.id)
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted"
                  >
                    {isExpanded ? "Ocultar" : "Detalle"}
                  </button>
                  <button
                    disabled={!canEdit}
                    onClick={() => startEditTreatment(treatment)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={14} className="inline-block align-[-2px]" />{" "}
                    Editar
                  </button>
                </div>
                {isExpanded ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    {isEditing ? (
                      <form
                        onSubmit={saveTreatmentEdit}
                        className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-ink">
                            Editar tratamiento
                          </p>
                          <button
                            type="button"
                            onClick={cancelEditTreatment}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-muted"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <label className="space-y-2 text-sm font-semibold text-ink">
                            Nombre
                            <input
                              value={editTitle}
                              onChange={(event) =>
                                setEditTitle(event.target.value)
                              }
                              required
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                            />
                          </label>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-ink">
                              Servicios
                            </p>
                            <div className="grid gap-2">
                              {activeServices.map((service) => (
                                <button
                                  type="button"
                                  key={service.id}
                                  onClick={() => toggleEditService(service.id)}
                                  className={`rounded-2xl border p-3 text-left text-sm transition ${editServiceIds.includes(service.id) ? "border-primary bg-white text-primary" : "border-slate-200 bg-white text-muted"}`}
                                >
                                  <span className="block font-bold">
                                    {service.name}
                                  </span>
                                  <span>
                                    {formatMoney(
                                      Number(service.price),
                                      settings,
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white p-4 text-right text-lg font-black text-ink">
                            Nuevo total: {formatMoney(editTotal, settings)}
                          </div>
                          <label className="space-y-2 text-sm font-semibold text-ink">
                            Observaciones
                            <textarea
                              value={editNotes}
                              onChange={(event) =>
                                setEditNotes(event.target.value)
                              }
                              rows={3}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted"
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            disabled={editing}
                            className="btn-primary disabled:bg-slate-300"
                          >
                            {editing ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTreatment}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-muted"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {(treatment.treatment_services || []).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                            >
                              <span className="text-muted">
                                {item.services?.name || "Servicio"}
                              </span>
                              <strong className="text-ink">
                                {formatMoney(
                                  Number(item.total_price),
                                  settings,
                                )}
                              </strong>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              void updateTreatmentStatus(
                                treatment,
                                "in_progress",
                              )
                            }
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted"
                          >
                            En ejecución
                          </button>
                          <button
                            onClick={() =>
                              void updateTreatmentStatus(treatment, "finished")
                            }
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted"
                          >
                            Finalizar
                          </button>
                          <button
                            onClick={() =>
                              void updateTreatmentStatus(treatment, "cancelled")
                            }
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-muted"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {filteredTreatments.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
            No hay tratamientos para los filtros seleccionados.
          </p>
        ) : null}
        <PaginationControls
          page={treatmentPage}
          pageSize={listPageSize}
          totalItems={filteredTreatments.length}
          onPageChange={setTreatmentPage}
          onPageSizeChange={setListPageSize}
          className="mt-5"
        />
      </section>
    </div>
  );
}
