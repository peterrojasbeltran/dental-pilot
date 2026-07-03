-- Dental Pilot v1.3.2
-- Hardening & QA: columnas de auditoría para módulos sensibles.
-- Migración segura/idempotente. No elimina datos existentes.

create extension if not exists pgcrypto;

-- Pagos
alter table if exists public.payments
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_by uuid null references auth.users(id) on delete set null,
  add column if not exists voided_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

-- Egresos
alter table if exists public.expenses
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_by uuid null references auth.users(id) on delete set null,
  add column if not exists voided_by uuid null references auth.users(id) on delete set null;

-- Inventario: movimientos e insumos
alter table if exists public.inventory_movements
  add column if not exists created_by uuid null references auth.users(id) on delete set null;

alter table if exists public.inventory_items
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_by uuid null references auth.users(id) on delete set null;

-- Índices de soporte para auditoría futura.
create index if not exists idx_payments_created_by on public.payments(created_by);
create index if not exists idx_payments_voided_by on public.payments(voided_by);
create index if not exists idx_expenses_created_by on public.expenses(created_by);
create index if not exists idx_expenses_voided_by on public.expenses(voided_by);
create index if not exists idx_inventory_movements_created_by on public.inventory_movements(created_by);

-- Nota: la UI de permisos por rol se deja para una versión posterior.
