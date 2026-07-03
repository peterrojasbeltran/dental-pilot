"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Edit3,
  Plus,
  Save,
  WalletCards,
  XCircle,
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { OperationalKpi } from "@/components/ui/operational-kpi";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { formatMoney } from "@/lib/currency";
import { Toast, useToast } from "@/components/ui/toast";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  ClinicSettings,
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  Payment,
} from "@/types/database";

type Props = {
  settings: ClinicSettings;
  payments: Payment[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  mode?: "app" | "demo";
};

type ExpenseForm = {
  expense_date: string;
  category_id: string;
  description: string;
  amount: string;
  payment_method: ExpensePaymentMethod;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: ExpenseForm = {
  expense_date: today(),
  category_id: "",
  description: "",
  amount: "",
  payment_method: "qr",
  notes: "",
};

const paymentMethodLabels: Record<ExpensePaymentMethod, string> = {
  cash: "Efectivo",
  qr: "QR",
  transfer: "Transferencia",
  card: "Tarjeta",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error)
    return String(
      (error as { message?: unknown }).message || "Intenta nuevamente.",
    );
  return "Intenta nuevamente.";
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function FinanceManager({
  settings,
  payments,
  expenses,
  categories,
  mode = "app",
}: Props) {
  const router = useRouter();
  const isDemo = mode === "demo";
  const { toast, showToast, closeToast } = useToast();
  const activeCategories = categories.filter(
    (category) => category.is_active !== false,
  );
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [form, setForm] = useState<ExpenseForm>({
    ...emptyForm,
    category_id: activeCategories[0]?.id || "",
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const activeExpenses = expenses.filter(
    (expense) => (expense.status || "active") === "active",
  );
  const income = payments
    .filter((payment) => payment.status !== "voided")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalExpenses = activeExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const result = income - totalExpenses;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    activeExpenses.forEach((expense) => {
      const name = expense.expense_categories?.name || "Sin categoría";
      map.set(name, (map.get(name) || 0) + Number(expense.amount || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [activeExpenses]);

  const filteredExpenses = useMemo(() => {
    const q = normalize(query.trim());
    return expenses.filter((expense) => {
      const status = expense.status || "active";
      const matchesQuery =
        !q ||
        [
          expense.description,
          expense.notes || "",
          expense.expense_categories?.name || "",
        ].some((value) => normalize(value).includes(q));
      const matchesCategory =
        categoryFilter === "all" || expense.category_id === categoryFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, expenses, query, statusFilter]);

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, page, pageSize]);

  function resetForm() {
    setForm({ ...emptyForm, category_id: activeCategories[0]?.id || "" });
    setEditingExpenseId(null);
  }

  function startEdit(expense: Expense) {
    if ((expense.status || "active") !== "active")
      return showToast(
        "warning",
        "Egreso anulado",
        "Los egresos anulados son solo lectura.",
      );
    setEditingExpenseId(expense.id);
    setForm({
      expense_date: expense.expense_date,
      category_id: expense.category_id || activeCategories[0]?.id || "",
      description: expense.description,
      amount: String(expense.amount),
      payment_method: expense.payment_method,
      notes: expense.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para registrar egresos reales.",
      );
    if (!form.description.trim())
      return showToast(
        "warning",
        "Descripción requerida",
        "Ingresa el concepto del egreso.",
      );
    const amount = Number(form.amount || 0);
    if (Number.isNaN(amount) || amount <= 0)
      return showToast(
        "warning",
        "Monto inválido",
        "El monto debe ser mayor a cero.",
      );
    if (!form.category_id)
      return showToast(
        "warning",
        "Categoría requerida",
        "Selecciona una categoría de egreso.",
      );

    const payload = {
      category_id: form.category_id,
      expense_date: form.expense_date,
      description: form.description.trim(),
      amount,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = editingExpenseId
        ? await supabase
            .from("expenses")
            .update(payload)
            .eq("id", editingExpenseId)
            .eq("status", "active")
        : await supabase.from("expenses").insert(payload);
      if (error) throw error;
      showToast(
        "success",
        editingExpenseId ? "Egreso actualizado" : "Egreso registrado",
        `${form.description.trim()} · ${formatMoney(amount, settings)}`,
      );
      resetForm();
      router.refresh();
    } catch (error) {
      showToast(
        "error",
        editingExpenseId ? "No se pudo actualizar" : "No se pudo registrar",
        getErrorMessage(error),
      );
    }
  }

  async function voidExpense(expense: Expense) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para anular egresos reales.",
      );
    if ((expense.status || "active") !== "active") return;
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("expenses")
        .update({
          status: "voided",
          voided_at: new Date().toISOString(),
          void_reason: "Anulado desde Finanzas",
          updated_at: new Date().toISOString(),
        })
        .eq("id", expense.id);
      if (error) throw error;
      showToast(
        "success",
        "Egreso anulado",
        "El egreso se conserva en historial y no afecta los reportes.",
      );
      if (editingExpenseId === expense.id) resetForm();
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo anular", getErrorMessage(error));
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para crear categorías reales.",
      );
    const name = newCategoryName.trim();
    if (!name)
      return showToast(
        "warning",
        "Nombre requerido",
        "Ingresa el nombre de la categoría.",
      );
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("expense_categories")
        .insert({ name, is_active: true });
      if (error) throw error;
      setNewCategoryName("");
      showToast("success", "Categoría creada", name);
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo crear", getErrorMessage(error));
    }
  }

  async function toggleCategory(category: ExpenseCategory) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para modificar categorías reales.",
      );
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("expense_categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw error;
      showToast(
        "success",
        category.is_active ? "Categoría inactiva" : "Categoría activa",
        category.name,
      );
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo actualizar", getErrorMessage(error));
    }
  }

  function exportExpenses() {
    downloadCsv(
      "dental-pilot-egresos.csv",
      [
        "Fecha",
        "Categoría",
        "Descripción",
        "Monto",
        "Método",
        "Estado",
        "Notas",
      ],
      expenses.map((expense) => [
        expense.expense_date,
        expense.expense_categories?.name || "",
        expense.description,
        expense.amount,
        paymentMethodLabels[expense.payment_method],
        (expense.status || "active") === "active" ? "Activo" : "Anulado",
        expense.notes || "",
      ]),
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {toast ? <Toast toast={toast} onClose={closeToast} /> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-soft">
          <p className="text-sm font-semibold text-emerald-800">
            Ingresos registrados
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {formatMoney(income, settings)}
          </p>
          <p className="mt-3 text-xs text-emerald-700">
            Pagos activos acumulados.
          </p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-soft">
          <p className="text-sm font-semibold text-rose-800">Egresos activos</p>
          <p className="mt-2 text-2xl font-black text-rose-950">
            {formatMoney(totalExpenses, settings)}
          </p>
          <p className="mt-3 text-xs text-rose-700">
            No incluye egresos anulados.
          </p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-soft">
          <p className="text-sm font-semibold text-blue-800">Resultado</p>
          <p className="mt-2 text-2xl font-black text-blue-950">
            {formatMoney(result, settings)}
          </p>
          <p className="mt-3 text-xs text-blue-700">
            Ingresos menos egresos activos.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <form onSubmit={saveExpense} className="card p-5">
            <div className="flex items-center gap-2">
              <WalletCards size={18} className="text-primary" />
              <h2 className="font-black text-ink">
                {editingExpenseId ? "Editar egreso" : "Registrar egreso"}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Registro simple para laboratorio, insumos, servicios o gastos del
              consultorio.
            </p>

            <div className="mt-5 grid gap-3">
              <label className="form-label">Fecha</label>
              <input
                className="input"
                type="date"
                value={form.expense_date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expense_date: event.target.value,
                  }))
                }
                disabled={isDemo}
              />

              <label className="form-label">Categoría</label>
              <select
                className="input"
                value={form.category_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category_id: event.target.value,
                  }))
                }
                disabled={isDemo}
              >
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="form-label">Descripción</label>
              <input
                className="input"
                placeholder="Ej. Laboratorio corona paciente Ana"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                disabled={isDemo}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label">Monto</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    disabled={isDemo}
                  />
                </div>
                <div>
                  <label className="form-label">Método</label>
                  <select
                    className="input"
                    value={form.payment_method}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_method: event.target
                          .value as ExpensePaymentMethod,
                      }))
                    }
                    disabled={isDemo}
                  >
                    {Object.entries(paymentMethodLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <label className="form-label">Observación</label>
              <textarea
                className="input min-h-24"
                placeholder="Opcional"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                disabled={isDemo}
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-primary justify-center"
                  type="submit"
                  disabled={isDemo}
                >
                  <Save size={16} />{" "}
                  {editingExpenseId ? "Guardar cambios" : "Registrar egreso"}
                </button>
                {editingExpenseId ? (
                  <button
                    type="button"
                    className="btn-secondary justify-center"
                    onClick={resetForm}
                  >
                    Cancelar edición
                  </button>
                ) : null}
              </div>
              {isDemo ? (
                <p className="rounded-2xl bg-blue-50 p-3 text-xs font-semibold text-primary">
                  Demo en solo lectura.
                </p>
              ) : null}
            </div>
          </form>

          <form onSubmit={createCategory} className="card p-5">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              <h2 className="font-black text-ink">Categorías</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Personaliza categorías de gasto para tu consultorio.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                className="input"
                placeholder="Nueva categoría"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                disabled={isDemo}
              />
              <button
                type="submit"
                className="btn-primary justify-center"
                disabled={isDemo}
              >
                Agregar
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${category.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
                >
                  {category.name} · {category.is_active ? "Activa" : "Inactiva"}
                </button>
              ))}
            </div>
          </form>
        </div>

        <div className="card p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-black text-ink">Egresos recientes</h2>
              <p className="mt-1 text-sm text-muted">
                Lista compacta para revisar gastos del consultorio.
              </p>
            </div>
            <button
              type="button"
              onClick={exportExpenses}
              className="btn-secondary justify-center"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_170px_150px]">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Buscar egreso..."
            />
            <select
              className="input h-11"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Todas</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="input h-11"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="active">Activos</option>
              <option value="voided">Anulados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <OperationalKpi
              label="Total"
              value={expenses.length}
              help="Egresos"
            />
            <OperationalKpi
              label="Activos"
              value={activeExpenses.length}
              help="Impactan reportes"
              tone="warning"
            />
            <OperationalKpi
              label="Anulados"
              value={expenses.length - activeExpenses.length}
              help="Histórico"
            />
            <OperationalKpi
              label="Categorías"
              value={activeCategories.length}
              help="Disponibles"
              tone="primary"
            />
          </div>

          <div className="mt-4 grid gap-2">
            {paginatedExpenses.map((expense) => {
              const isVoided = (expense.status || "active") === "voided";
              return (
                <div
                  key={expense.id}
                  className={`grid gap-2 rounded-2xl border p-3 text-sm md:grid-cols-[105px_1fr_130px_auto] md:items-center ${isVoided ? "border-slate-100 bg-slate-50 opacity-70" : "border-slate-100 bg-white"}`}
                >
                  <p className="font-semibold text-ink">
                    {new Date(expense.expense_date).toLocaleDateString(
                      settings.locale,
                      { day: "2-digit", month: "short" },
                    )}
                  </p>
                  <div>
                    <p className="font-bold text-ink">{expense.description}</p>
                    <p className="mt-1 text-xs text-muted">
                      {expense.expense_categories?.name || "Sin categoría"} ·{" "}
                      {paymentMethodLabels[expense.payment_method]}
                    </p>
                  </div>
                  <p className="font-black text-ink">
                    {formatMoney(Number(expense.amount || 0), settings)}
                  </p>
                  <div className="flex items-center gap-2 justify-start md:justify-end">
                    <StatusPill
                      label={isVoided ? "Anulado" : "Activo"}
                      variant={isVoided ? "neutral" : "warning"}
                    />
                    {!isVoided && !isDemo ? (
                      <>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-primary hover:text-primary"
                          onClick={() => startEdit(expense)}
                          aria-label="Editar egreso"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-100 p-2 text-rose-500 hover:bg-rose-50"
                          onClick={() => voidExpense(expense)}
                          aria-label="Anular egreso"
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {filteredExpenses.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">
                No hay egresos para los filtros seleccionados.
              </p>
            ) : null}
          </div>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredExpenses.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="mt-5"
          />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-black text-ink">Egresos por categoría</h2>
        <p className="mt-1 text-sm text-muted">
          Ayuda a identificar en qué se está gastando más. No incluye egresos
          anulados.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {byCategory.map(([name, amount]) => (
            <div
              key={name}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <p className="text-sm font-semibold text-muted">{name}</p>
              <p className="mt-2 text-xl font-black text-ink">
                {formatMoney(amount, settings)}
              </p>
            </div>
          ))}
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no hay egresos categorizados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
