-- Dental Pilot v1.3.1
-- Finanzas: edición/anulación de egresos y categorías personalizadas.
-- Migración segura: no elimina datos existentes.

create extension if not exists pgcrypto;

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid null references expense_categories(id) on delete set null,
  expense_date date not null default current_date,
  description text not null,
  amount numeric not null check (amount > 0),
  payment_method text not null default 'qr' check (payment_method in ('cash', 'qr', 'transfer', 'card')),
  notes text null,
  created_at timestamptz not null default now()
);

alter table expense_categories add column if not exists is_active boolean default true;
alter table expense_categories add column if not exists created_at timestamptz default now();
update expense_categories set is_active = coalesce(is_active, true), created_at = coalesce(created_at, now());
alter table expense_categories alter column is_active set not null;
alter table expense_categories alter column is_active set default true;
alter table expense_categories alter column created_at set not null;
alter table expense_categories alter column created_at set default now();

alter table expenses add column if not exists category_id uuid references expense_categories(id) on delete set null;
alter table expenses add column if not exists expense_date date default current_date;
alter table expenses add column if not exists description text;
alter table expenses add column if not exists amount numeric;
alter table expenses add column if not exists payment_method text default 'qr';
alter table expenses add column if not exists notes text;
alter table expenses add column if not exists status text default 'active';
alter table expenses add column if not exists voided_at timestamptz null;
alter table expenses add column if not exists void_reason text null;
alter table expenses add column if not exists updated_at timestamptz default now();
alter table expenses add column if not exists created_at timestamptz default now();

update expenses
set expense_date = coalesce(expense_date, current_date),
    payment_method = coalesce(payment_method, 'qr'),
    status = coalesce(status, 'active'),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now());

alter table expenses alter column expense_date set not null;
alter table expenses alter column expense_date set default current_date;
alter table expenses alter column description set not null;
alter table expenses alter column amount set not null;
alter table expenses alter column payment_method set not null;
alter table expenses alter column payment_method set default 'qr';
alter table expenses alter column status set not null;
alter table expenses alter column status set default 'active';
alter table expenses alter column created_at set not null;
alter table expenses alter column created_at set default now();
alter table expenses alter column updated_at set not null;
alter table expenses alter column updated_at set default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_amount_positive') then
    alter table expenses add constraint expenses_amount_positive check (amount > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expenses_payment_method_check') then
    alter table expenses add constraint expenses_payment_method_check check (payment_method in ('cash', 'qr', 'transfer', 'card'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expenses_status_check') then
    alter table expenses add constraint expenses_status_check check (status in ('active', 'voided'));
  end if;
end $$;

create index if not exists idx_expenses_date on expenses(expense_date desc);
create index if not exists idx_expenses_category on expenses(category_id);
create index if not exists idx_expenses_status on expenses(status);
create index if not exists idx_expense_categories_active on expense_categories(is_active);

alter table expense_categories enable row level security;
alter table expenses enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_categories' and policyname = 'authenticated_all_expense_categories') then
    create policy authenticated_all_expense_categories on expense_categories for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'authenticated_all_expenses') then
    create policy authenticated_all_expenses on expenses for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into expense_categories (name, is_active)
select * from (values
  ('Laboratorio', true),
  ('Insumos', true),
  ('Mantenimiento', true),
  ('Servicios', true),
  ('Marketing', true),
  ('Personal', true),
  ('Otros', true)
) as seed(name, is_active)
on conflict (name) do update set is_active = excluded.is_active;
