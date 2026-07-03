"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Edit3,
  PackagePlus,
  Plus,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Toast, useToast } from "@/components/ui/toast";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementReason,
  InventoryMovementType,
} from "@/types/database";

type Props = {
  items: InventoryItem[];
  movements: InventoryMovement[];
  mode?: "app" | "demo";
};

type ItemForm = {
  name: string;
  category: string;
  unit: string;
  current_stock: string;
  minimum_stock: string;
  notes: string;
};

type MovementForm = {
  item_id: string;
  movement_type: InventoryMovementType;
  reason: InventoryMovementReason;
  quantity: string;
  notes: string;
};

const emptyItemForm: ItemForm = {
  name: "",
  category: "Bioseguridad",
  unit: "unidad",
  current_stock: "0",
  minimum_stock: "0",
  notes: "",
};

const emptyMovementForm: MovementForm = {
  item_id: "",
  movement_type: "in",
  reason: "purchase",
  quantity: "1",
  notes: "",
};

const categoryOptions = [
  "Bioseguridad",
  "Clínico",
  "Restauración",
  "Ortodoncia",
  "Limpieza",
  "Otros",
];
const unitOptions = ["unidad", "caja", "paquete", "frasco", "kit"];

const reasonLabels: Record<InventoryMovementReason, string> = {
  purchase: "Compra",
  consumption: "Consumo",
  loss: "Pérdida",
  adjustment: "Ajuste",
};

function isLowStock(item: InventoryItem) {
  return Number(item.current_stock || 0) <= Number(item.minimum_stock || 0);
}

function movementLabel(type: InventoryMovementType) {
  if (type === "in") return "Entrada";
  if (type === "out") return "Salida";
  return "Ajuste";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(
      (error as { message?: unknown }).message || "Intenta nuevamente.",
    );
  }
  return "Intenta nuevamente.";
}

function getAllowedReasons(
  type: InventoryMovementType,
): InventoryMovementReason[] {
  if (type === "in") return ["purchase", "adjustment"];
  if (type === "out") return ["consumption", "loss"];
  return ["adjustment"];
}

export function InventoryManager({ items, movements, mode = "app" }: Props) {
  const router = useRouter();
  const isDemo = mode === "demo";
  const { toast, showToast, closeToast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "low" | "ok" | "inactive"
  >("all");
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState<MovementForm>({
    ...emptyMovementForm,
    item_id: items[0]?.id || "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id || null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const activeItems = items.filter((item) => item.is_active !== false);
  const lowStockItems = activeItems.filter(isLowStock);
  const totalStock = activeItems.reduce(
    (sum, item) => sum + Number(item.current_stock || 0),
    0,
  );

  const filteredItems = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        [item.name, item.category || "", item.unit, item.notes || ""].some(
          (value) => normalize(value).includes(q),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "low" &&
          item.is_active !== false &&
          isLowStock(item)) ||
        (statusFilter === "ok" &&
          item.is_active !== false &&
          !isLowStock(item)) ||
        (statusFilter === "inactive" && item.is_active === false);
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const movementsByItem = useMemo(() => {
    const map = new Map<string, InventoryMovement[]>();
    movements.forEach((movement) => {
      const list = map.get(movement.item_id) || [];
      list.push(movement);
      map.set(movement.item_id, list);
    });
    return map;
  }, [movements]);

  function startEdit(item: InventoryItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category || "Otros",
      unit: item.unit || "unidad",
      current_stock: String(item.current_stock ?? 0),
      minimum_stock: String(item.minimum_stock ?? 0),
      notes: item.notes || "",
    });
    setExpandedId(item.id);
  }

  function resetItemForm() {
    setEditingItem(null);
    setItemForm(emptyItemForm);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para gestionar inventario real.",
      );
    if (!itemForm.name.trim())
      return showToast(
        "warning",
        "Nombre requerido",
        "Ingresa el nombre del insumo.",
      );

    const currentStock = Number(itemForm.current_stock || 0);
    const minimumStock = Number(itemForm.minimum_stock || 0);
    if (
      Number.isNaN(currentStock) ||
      currentStock < 0 ||
      Number.isNaN(minimumStock) ||
      minimumStock < 0
    ) {
      return showToast(
        "warning",
        "Stock inválido",
        "Los valores de stock deben ser números positivos.",
      );
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        name: itemForm.name.trim(),
        category: itemForm.category || "Otros",
        unit: itemForm.unit || "unidad",
        current_stock: currentStock,
        minimum_stock: minimumStock,
        notes: itemForm.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingItem
        ? await supabase
            .from("inventory_items")
            .update(payload)
            .eq("id", editingItem.id)
        : await supabase.from("inventory_items").insert(payload);
      if (error) throw error;
      showToast(
        "success",
        editingItem ? "Insumo actualizado" : "Insumo creado",
        itemForm.name.trim(),
      );
      resetItemForm();
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo guardar", getErrorMessage(error));
    }
  }

  async function toggleItem(item: InventoryItem) {
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para activar o desactivar insumos.",
      );
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("inventory_items")
        .update({
          is_active: item.is_active === false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
      showToast(
        "success",
        item.is_active === false ? "Insumo activado" : "Insumo desactivado",
        item.name,
      );
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo actualizar", getErrorMessage(error));
    }
  }

  async function saveMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo)
      return showToast(
        "info",
        "Demo en solo lectura",
        "Ingresa al sistema para registrar movimientos reales.",
      );
    const item = items.find(
      (candidate) => candidate.id === movementForm.item_id,
    );
    if (!item)
      return showToast(
        "warning",
        "Selecciona un insumo",
        "Elige el insumo para registrar el movimiento.",
      );
    const quantity = Number(movementForm.quantity || 0);
    if (Number.isNaN(quantity) || quantity <= 0)
      return showToast(
        "warning",
        "Cantidad inválida",
        "La cantidad debe ser mayor a cero.",
      );
    if (
      !getAllowedReasons(movementForm.movement_type).includes(
        movementForm.reason,
      )
    ) {
      return showToast(
        "warning",
        "Motivo inválido",
        "Selecciona un motivo compatible con el tipo de movimiento.",
      );
    }

    const previousStock = Number(item.current_stock || 0);
    let newStock = previousStock;
    if (movementForm.movement_type === "in")
      newStock = previousStock + quantity;
    if (movementForm.movement_type === "out")
      newStock = previousStock - quantity;
    if (movementForm.movement_type === "adjustment") newStock = quantity;

    if (newStock < 0)
      return showToast(
        "warning",
        "Stock insuficiente",
        "No puedes registrar una salida mayor al stock actual.",
      );

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          item_id: item.id,
          movement_type: movementForm.movement_type,
          reason: movementForm.reason,
          quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: movementForm.notes.trim() || null,
        });
      if (movementError) throw movementError;

      const { error: itemError } = await supabase
        .from("inventory_items")
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (itemError) throw itemError;

      showToast(
        "success",
        "Movimiento registrado",
        `${item.name}: ${previousStock} → ${newStock} ${item.unit}`,
      );
      setMovementForm({ ...emptyMovementForm, item_id: item.id });
      setExpandedId(item.id);
      router.refresh();
    } catch (error) {
      showToast("error", "No se pudo registrar", getErrorMessage(error));
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <Toast toast={toast} onClose={closeToast} />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-semibold text-muted">Insumos activos</p>
          <p className="mt-2 text-3xl font-black text-ink">
            {activeItems.length}
          </p>
          <p className="mt-2 text-xs text-muted">
            Catálogo operativo del consultorio.
          </p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-soft">
          <p className="text-sm font-semibold text-amber-900">Stock bajo</p>
          <p className="mt-2 text-3xl font-black text-amber-950">
            {lowStockItems.length}
          </p>
          <p className="mt-2 text-xs text-amber-800">
            Insumos que requieren reposición.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-muted">Stock total</p>
          <p className="mt-2 text-3xl font-black text-ink">{totalStock}</p>
          <p className="mt-2 text-xs text-muted">
            Suma simple de unidades registradas.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-black text-ink">Inventario actual</h2>
                <p className="mt-1 text-sm text-muted">
                  Control simple de insumos para consultorio pequeño.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                  placeholder="Buscar insumo..."
                  className="rounded-xl sm:w-80"
                  inputClassName="font-normal"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className="input h-11 w-full sm:w-40"
                >
                  <option value="all">Todos</option>
                  <option value="low">Stock bajo</option>
                  <option value="ok">Stock OK</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3">Insumo</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      <td className="py-3 font-bold text-ink">
                        {item.name}
                        <p className="mt-1 text-xs font-normal text-muted">
                          {item.unit}
                        </p>
                      </td>
                      <td className="text-muted">{item.category || "Otros"}</td>
                      <td className="font-black text-ink">
                        {item.current_stock}
                      </td>
                      <td className="text-muted">{item.minimum_stock}</td>
                      <td>
                        {item.is_active === false ? (
                          <StatusPill label="Inactivo" />
                        ) : isLowStock(item) ? (
                          <StatusPill label="Bajo stock" variant="warning" />
                        ) : (
                          <StatusPill label="OK" variant="success" />
                        )}
                      </td>
                      <td
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-primary"
                            aria-label="Editar insumo"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => toggleItem(item)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-primary"
                            aria-label="Activar o desactivar"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {paginatedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === item.id ? null : item.id)
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-ink">{item.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.category || "Otros"} · {item.unit}
                      </p>
                    </div>
                    {item.is_active === false ? (
                      <StatusPill label="Inactivo" />
                    ) : isLowStock(item) ? (
                      <StatusPill label="Bajo" variant="warning" />
                    ) : (
                      <StatusPill label="OK" variant="success" />
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-muted">Stock</p>
                      <p className="font-black text-ink">
                        {item.current_stock}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs text-muted">Mínimo</p>
                      <p className="font-black text-ink">
                        {item.minimum_stock}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted">
                No hay insumos con ese filtro.
              </p>
            ) : null}
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={filteredItems.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              className="mt-5"
            />
          </div>

          {expandedId ? (
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary" />
                <h2 className="font-black text-ink">Movimientos recientes</h2>
              </div>
              <div className="mt-4 space-y-2">
                {(movementsByItem.get(expandedId) || [])
                  .slice(0, 8)
                  .map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-1 rounded-xl p-2 ${movement.movement_type === "in" ? "bg-emerald-50 text-emerald-700" : movement.movement_type === "out" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-primary"}`}
                        >
                          {movement.movement_type === "in" ? (
                            <ArrowUpCircle size={16} />
                          ) : movement.movement_type === "out" ? (
                            <ArrowDownCircle size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-ink">
                            {movementLabel(movement.movement_type)} ·{" "}
                            {reasonLabels[movement.reason]}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(movement.created_at).toLocaleDateString(
                              "es-BO",
                            )}{" "}
                            · {movement.previous_stock} → {movement.new_stock}
                          </p>
                          {movement.notes ? (
                            <p className="mt-1 text-xs text-muted">
                              {movement.notes}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className="font-black text-ink">{movement.quantity}</p>
                    </div>
                  ))}
                {(movementsByItem.get(expandedId) || []).length === 0 ? (
                  <p className="text-sm text-muted">
                    Sin movimientos registrados para este insumo.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <form onSubmit={saveItem} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-ink">
                  {editingItem ? "Editar insumo" : "Nuevo insumo"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Registra solo lo necesario para controlar stock.
                </p>
              </div>
              <PackagePlus size={22} className="text-primary" />
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  value={itemForm.name}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, name: event.target.value })
                  }
                  className="input mt-1"
                  placeholder="Guantes nitrilo"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Categoría
                  <select
                    value={itemForm.category}
                    onChange={(event) =>
                      setItemForm({ ...itemForm, category: event.target.value })
                    }
                    className="input mt-1"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-ink">
                  Unidad
                  <select
                    value={itemForm.unit}
                    onChange={(event) =>
                      setItemForm({ ...itemForm, unit: event.target.value })
                    }
                    className="input mt-1"
                  >
                    {unitOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Stock actual
                  <input
                    type="number"
                    min="0"
                    value={itemForm.current_stock}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        current_stock: event.target.value,
                      })
                    }
                    className="input mt-1"
                  />
                </label>
                <label className="text-sm font-semibold text-ink">
                  Stock mínimo
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minimum_stock}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        minimum_stock: event.target.value,
                      })
                    }
                    className="input mt-1"
                  />
                </label>
              </div>
              <label className="text-sm font-semibold text-ink">
                Notas
                <textarea
                  value={itemForm.notes}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, notes: event.target.value })
                  }
                  className="input mt-1 min-h-24"
                  placeholder="Notas internas"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary flex-1" type="submit">
                <Save size={16} /> {editingItem ? "Guardar" : "Crear"}
              </button>
              {editingItem ? (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <form onSubmit={saveMovement} className="card p-5">
            <div>
              <h2 className="font-black text-ink">Registrar movimiento</h2>
              <p className="mt-1 text-sm text-muted">
                Entradas y salidas manuales. No se descuenta desde tratamientos
                todavía.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm font-semibold text-ink">
                Insumo
                <select
                  value={movementForm.item_id}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      item_id: event.target.value,
                    })
                  }
                  className="input mt-1"
                >
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Tipo
                  <select
                    value={movementForm.movement_type}
                    onChange={(event) => {
                      const type = event.target.value as InventoryMovementType;
                      setMovementForm({
                        ...movementForm,
                        movement_type: type,
                        reason:
                          type === "in"
                            ? "purchase"
                            : type === "out"
                              ? "consumption"
                              : "adjustment",
                      });
                    }}
                    className="input mt-1"
                  >
                    <option value="in">Entrada</option>
                    <option value="out">Salida</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-ink">
                  Motivo
                  <select
                    value={movementForm.reason}
                    onChange={(event) =>
                      setMovementForm({
                        ...movementForm,
                        reason: event.target.value as InventoryMovementReason,
                      })
                    }
                    className="input mt-1"
                  >
                    {getAllowedReasons(movementForm.movement_type).map(
                      (reason) => (
                        <option key={reason} value={reason}>
                          {reasonLabels[reason]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <label className="text-sm font-semibold text-ink">
                Cantidad
                <input
                  type="number"
                  min="1"
                  value={movementForm.quantity}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      quantity: event.target.value,
                    })
                  }
                  className="input mt-1"
                />
              </label>
              <label className="text-sm font-semibold text-ink">
                Notas
                <textarea
                  value={movementForm.notes}
                  onChange={(event) =>
                    setMovementForm({
                      ...movementForm,
                      notes: event.target.value,
                    })
                  }
                  className="input mt-1 min-h-20"
                  placeholder="Compra, consumo, ajuste..."
                />
              </label>
            </div>
            <button className="btn-primary mt-4 w-full" type="submit">
              <Plus size={16} /> Registrar movimiento
            </button>
          </form>

          {lowStockItems.length ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3">
                <AlertTriangle size={22} className="text-amber-700" />
                <div>
                  <h2 className="font-black text-amber-950">
                    Insumos críticos
                  </h2>
                  <p className="mt-1 text-sm text-amber-800">
                    Revisa reposición de {lowStockItems.length} insumo(s).
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white/70 p-3 text-sm font-semibold text-amber-900"
                  >
                    {item.name}: {item.current_stock} / mín.{" "}
                    {item.minimum_stock}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
