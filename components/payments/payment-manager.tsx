"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Landmark, QrCode, ReceiptText, Search, Wallet, XCircle } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Toast, useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/currency";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Budget, ClinicSettings, Payment, PaymentMethod } from "@/types/database";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  qr: "QR",
  transfer: "Transferencia",
  card: "Tarjeta"
};

const paymentMethodIcons: Record<PaymentMethod, ReactNode> = {
  cash: <Wallet size={16} />,
  qr: <QrCode size={16} />,
  transfer: <Landmark size={16} />,
  card: <CreditCard size={16} />
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function activePayments(payments: Payment[]) {
  return payments.filter((payment) => payment.status !== "voided");
}

function paidForBudget(budget: Budget, payments: Payment[]) {
  const activeSum = activePayments(payments)
    .filter((payment) => payment.budget_id === budget.id)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return activeSum > 0 ? activeSum : Number(budget.paid_amount || 0);
}

function paymentStatus(total: number, paid: number) {
  if (paid <= 0) return { label: "Pendiente", variant: "warning" as const, value: "pending" as const };
  if (paid >= total) return { label: "Pagado", variant: "success" as const, value: "paid" as const };
  return { label: "Parcial", variant: "primary" as const, value: "partial" as const };
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

type Props = {
  settings: ClinicSettings;
  budgets: Budget[];
  payments: Payment[];
  mode?: "app" | "demo";
};

export function PaymentManager({ settings, budgets, payments, mode = "app" }: Props) {
  const isDemo = mode === "demo";
  const router = useRouter();
  const { toast, showToast, closeToast } = useToast();

  const payableBudgets = useMemo(() => budgets.filter((budget) => budget.status === "approved"), [budgets]);
  const [budgetSearch, setBudgetSearch] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState(payableBudgets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("qr");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [approvedSearch, setApprovedSearch] = useState("");
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedPageSize, setApprovedPageSize] = useState(10);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(10);

  const selectedBudget = payableBudgets.find((budget) => budget.id === selectedBudgetId);
  const selectedPaid = selectedBudget ? paidForBudget(selectedBudget, payments) : 0;
  const selectedTotal = Number(selectedBudget?.total_amount || 0);
  const selectedBalance = Math.max(0, selectedTotal - selectedPaid);

  const filteredBudgets = useMemo(() => {
    const query = normalize(budgetSearch.trim());
    const source = payableBudgets.filter((budget) => {
      if (!query) return true;
      return normalize(`${budget.id} ${budget.patients?.full_name || ""} ${budget.patients?.phone || ""} ${budget.treatments?.title || ""}`).includes(query);
    });
    return source.slice(0, 8);
  }, [budgetSearch, payableBudgets]);

  const totals = useMemo(() => {
    const active = activePayments(payments);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const paidThisMonth = active
      .filter((payment) => {
        const date = new Date(payment.paid_at);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const approvedTotal = payableBudgets.reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);
    const totalPaid = payableBudgets.reduce((sum, budget) => sum + paidForBudget(budget, payments), 0);
    const pendingBalance = Math.max(0, approvedTotal - totalPaid);
    const noPayment = payableBudgets.filter((budget) => paidForBudget(budget, payments) <= 0).length;
    const partial = payableBudgets.filter((budget) => {
      const paid = paidForBudget(budget, payments);
      return paid > 0 && paid < Number(budget.total_amount || 0);
    }).length;

    return { paidThisMonth, pendingBalance, noPayment, partial };
  }, [payableBudgets, payments]);

  const filteredApprovedBudgets = useMemo(() => {
    const query = normalize(approvedSearch.trim());
    if (!query) return payableBudgets;
    return payableBudgets.filter((budget) =>
      normalize(`${budget.patients?.full_name || ""} ${budget.patients?.phone || ""} ${budget.treatments?.title || ""} ${budget.id}`).includes(query)
    );
  }, [approvedSearch, payableBudgets]);

  const paginatedApprovedBudgets = useMemo(() => {
    const start = (approvedPage - 1) * approvedPageSize;
    return filteredApprovedBudgets.slice(start, start + approvedPageSize);
  }, [approvedPage, approvedPageSize, filteredApprovedBudgets]);

  const filteredPayments = useMemo(() => {
    const query = normalize(paymentSearch.trim());
    if (!query) return payments;
    return payments.filter((payment) =>
      normalize(`${payment.patients?.full_name || ""} ${payment.treatments?.title || ""} ${payment.method} ${payment.status}`).includes(query)
    );
  }, [paymentSearch, payments]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage, paymentPageSize]);

  async function updateBudgetPaymentState(budget: Budget, nextPaid: number) {
    const total = Number(budget.total_amount || 0);
    const status = paymentStatus(total, nextPaid).value;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("budgets")
      .update({ paid_amount: nextPaid, payment_status: status })
      .eq("id", budget.id);
    if (error) throw error;
  }

  async function registerPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeToast();
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para registrar pagos reales.");
    if (!selectedBudget) return showToast("warning", "Selecciona un presupuesto", "El pago debe asociarse a un presupuesto aprobado.");

    const numericAmount = Number(amount || 0);
    if (!numericAmount || numericAmount <= 0) return showToast("warning", "Monto inválido", "Ingresa un monto mayor a cero.");
    if (numericAmount > selectedBalance) {
      return showToast("warning", "El monto supera el saldo", `El saldo pendiente es ${formatMoney(selectedBalance, settings)}.`);
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("payments").insert({
        budget_id: selectedBudget.id,
        patient_id: selectedBudget.patient_id,
        treatment_id: selectedBudget.treatment_id,
        amount: numericAmount,
        method,
        notes: notes || null,
        status: "active"
      });
      if (error) throw error;

      await updateBudgetPaymentState(selectedBudget, selectedPaid + numericAmount);
      showToast("success", "Pago registrado", `Saldo pendiente: ${formatMoney(Math.max(0, selectedBalance - numericAmount), settings)}.`);
      setAmount("");
      setNotes("");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo registrar", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function voidPayment(payment: Payment) {
    if (isDemo) return showToast("info", "Demo en solo lectura", "Ingresa al sistema para anular pagos reales.");
    const budget = budgets.find((item) => item.id === payment.budget_id);
    if (!budget || payment.status === "voided") return;
    closeToast();
    setVoidingId(payment.id);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("payments").update({ status: "voided" }).eq("id", payment.id);
      if (error) throw error;
      const currentPaid = paidForBudget(budget, payments);
      await updateBudgetPaymentState(budget, Math.max(0, currentPaid - Number(payment.amount || 0)));
      showToast("success", "Pago anulado", "El saldo del presupuesto fue actualizado.");
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo anular", error instanceof Error ? error.message : "Intenta nuevamente.");
    } finally {
      setVoidingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <Toast toast={toast} onClose={closeToast} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialCard label="Ingresos del mes" value={formatMoney(totals.paidThisMonth, settings)} help="Pagos activos registrados" />
        <FinancialCard label="Saldo pendiente" value={formatMoney(totals.pendingBalance, settings)} help="Presupuestos aprobados" />
        <FinancialCard label="Sin pago" value={String(totals.noPayment)} help="Aprobados sin pago inicial" />
        <FinancialCard label="Pago parcial" value={String(totals.partial)} help="Con saldo pendiente" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={registerPayment} className="card p-5">
          <div className="flex items-center gap-2"><ReceiptText size={18} className="text-primary" /><h2 className="font-bold text-ink">Registrar pago</h2></div>
          <p className="mt-2 text-sm text-muted">Asocia cada pago a un presupuesto aprobado. No se permiten sobrepagos.</p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2 text-sm font-semibold text-ink">
              <span>Presupuesto aprobado</span>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-muted">
                  <Search size={16} />
                  <input value={budgetSearch} onChange={(event) => setBudgetSearch(event.target.value)} placeholder="Buscar por paciente, teléfono o tratamiento" className="w-full bg-transparent text-sm outline-none" />
                </div>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredBudgets.map((budget) => {
                    const paid = paidForBudget(budget, payments);
                    const balance = Math.max(0, Number(budget.total_amount || 0) - paid);
                    const state = paymentStatus(Number(budget.total_amount || 0), paid);
                    return (
                      <button type="button" key={budget.id} onClick={() => setSelectedBudgetId(budget.id)} className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${selectedBudgetId === budget.id ? "border-primary bg-blue-50 text-primary" : "border-slate-100 bg-white text-muted hover:border-slate-200"}`}>
                        <span className="block font-bold">{budget.patients?.full_name || "Paciente"}</span>
                        <span className="block">{budget.treatments?.title || "Tratamiento"} · Total {formatMoney(Number(budget.total_amount || 0), settings)}</span>
                        <span className="mt-1 block text-xs">{state.label} · Saldo {formatMoney(balance, settings)}</span>
                      </button>
                    );
                  })}
                  {filteredBudgets.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted">No hay presupuestos aprobados con esa búsqueda.</p> : null}
                </div>
              </div>
            </div>

            {selectedBudget ? (
              <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                <p className="text-muted">Total: <strong className="text-ink">{formatMoney(selectedTotal, settings)}</strong></p>
                <p className="text-muted">Pagado: <strong className="text-ink">{formatMoney(selectedPaid, settings)}</strong></p>
                <p className="mt-1 text-lg font-black text-ink">Saldo: {formatMoney(selectedBalance, settings)}</p>
              </div>
            ) : null}

            <label className="space-y-2 text-sm font-semibold text-ink">Monto ({settings.currency_symbol})
              <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted" />
            </label>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Método de pago</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((option) => (
                  <button key={option} type="button" onClick={() => setMethod(option)} className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${method === option ? "border-primary bg-blue-50 text-primary" : "border-slate-200 bg-white text-muted"}`}>
                    <span className="inline-flex items-center gap-2">{paymentMethodIcons[option]} {paymentMethodLabels[option]}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-2 text-sm font-semibold text-ink">Nota interna
              <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted" />
            </label>
          </div>

          <button disabled={saving || !selectedBudget || selectedBalance <= 0} className="btn-primary mt-5 disabled:bg-slate-300">
            {saving ? "Guardando..." : "Registrar pago"}
          </button>
        </form>

        <div className="card p-5">
          <h2 className="font-bold text-ink">Presupuestos aprobados</h2>
          <div className="mt-4">
            <SearchInput
              value={approvedSearch}
              onChange={(value) => {
                setApprovedSearch(value);
                setApprovedPage(1);
              }}
              placeholder="Buscar presupuesto aprobado..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {paginatedApprovedBudgets.map((budget) => {
              const paid = paidForBudget(budget, payments);
              const total = Number(budget.total_amount || 0);
              const balance = Math.max(0, total - paid);
              const state = paymentStatus(total, paid);
              return (
                <article key={budget.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{budget.patients?.full_name || "Paciente"}</p>
                      <p className="text-sm text-muted">{budget.treatments?.title || "Tratamiento"}</p>
                    </div>
                    <StatusPill label={state.label} variant={state.variant} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <p className="text-muted">Total <strong className="block text-ink">{formatMoney(total, settings)}</strong></p>
                    <p className="text-muted">Pagado <strong className="block text-ink">{formatMoney(paid, settings)}</strong></p>
                    <p className="text-muted">Saldo <strong className="block text-ink">{formatMoney(balance, settings)}</strong></p>
                  </div>
                </article>
              );
            })}
            {filteredApprovedBudgets.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">No hay presupuestos aprobados para ese filtro.</p> : null}
          </div>
          <PaginationControls
            page={approvedPage}
            pageSize={approvedPageSize}
            totalItems={filteredApprovedBudgets.length}
            onPageChange={setApprovedPage}
            onPageSizeChange={setApprovedPageSize}
            className="mt-4"
          />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-ink">Historial de pagos</h2>
        <div className="mt-4">
          <SearchInput
            value={paymentSearch}
            onChange={(value) => {
              setPaymentSearch(value);
              setPaymentPage(1);
            }}
            placeholder="Buscar pago por paciente, tratamiento o método..."
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400"><tr><th className="py-3">Fecha</th><th>Paciente</th><th>Tratamiento</th><th>Método</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.map((payment) => (
                <tr key={payment.id} className={payment.status === "voided" ? "opacity-50" : ""}>
                  <td className="py-3 font-semibold text-ink">{formatDateTime(payment.paid_at)}</td>
                  <td className="text-muted">{payment.patients?.full_name || "Paciente"}</td>
                  <td className="text-muted">{payment.treatments?.title || "Tratamiento"}</td>
                  <td className="text-muted">{paymentMethodLabels[payment.method] || payment.method}</td>
                  <td className="font-bold text-ink">{formatMoney(Number(payment.amount || 0), settings)}</td>
                  <td><StatusPill label={payment.status === "voided" ? "Anulado" : "Activo"} variant={payment.status === "voided" ? "neutral" : "success"} /></td>
                  <td className="text-right">
                    <button disabled={payment.status === "voided" || voidingId === payment.id} onClick={() => void voidPayment(payment)} className="rounded-xl border border-slate-200 p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40" title="Anular pago">
                      <XCircle size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 ? <tr><td colSpan={7} className="py-6 text-center text-muted">No hay pagos para ese filtro.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={paymentPage}
          pageSize={paymentPageSize}
          totalItems={filteredPayments.length}
          onPageChange={setPaymentPage}
          onPageSizeChange={setPaymentPageSize}
          className="mt-4"
        />
      </section>
    </div>
  );
}

function FinancialCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{help}</p>
    </div>
  );
}
