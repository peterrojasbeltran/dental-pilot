-- Dental Pilot v0.9.0
-- Pagos + Ingresos.
-- Ejecutar después de v0.7.0/v0.8.0.
-- No elimina datos existentes.

begin;

-- 1) Estado financiero del presupuesto.
alter table budgets
  add column if not exists paid_amount numeric(12,2) not null default 0,
  add column if not exists payment_status text not null default 'pending';

-- Reemplazar constraint si existía con una versión anterior.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'budgets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%payment_status%'
  loop
    execute format('alter table budgets drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table budgets
  add constraint budgets_payment_status_check check (payment_status in ('pending','partial','paid'));

-- 2) Tabla de pagos.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references budgets(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  treatment_id uuid references treatments(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'qr',
  status text not null default 'active',
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table payments add column if not exists budget_id uuid references budgets(id) on delete cascade;
alter table payments add column if not exists patient_id uuid references patients(id) on delete cascade;
alter table payments add column if not exists treatment_id uuid references treatments(id) on delete set null;
alter table payments add column if not exists method text not null default 'qr';
alter table payments add column if not exists status text not null default 'active';
alter table payments add column if not exists paid_at timestamptz not null default now();
alter table payments add column if not exists notes text;
alter table payments add column if not exists created_at timestamptz not null default now();

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'payments'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) like '%method%' or pg_get_constraintdef(oid) like '%status%')
  loop
    execute format('alter table payments drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table payments
  add constraint payments_method_check check (method in ('cash','qr','transfer','card'));

alter table payments
  add constraint payments_status_check check (status in ('active','voided'));

alter table payments enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'authenticated_all_payments') then
    create policy authenticated_all_payments on payments for all to authenticated using (true) with check (true);
  end if;
end $$;

create index if not exists payments_budget_idx on payments(budget_id);
create index if not exists payments_patient_idx on payments(patient_id);
create index if not exists payments_treatment_idx on payments(treatment_id);
create index if not exists payments_paid_at_idx on payments(paid_at);

-- 3) Recalcular presupuestos con pagos activos existentes.
update budgets b
set paid_amount = coalesce(p.sum_amount, 0),
    payment_status = case
      when coalesce(p.sum_amount, 0) <= 0 then 'pending'
      when coalesce(p.sum_amount, 0) >= b.total_amount then 'paid'
      else 'partial'
    end
from (
  select budget_id, sum(amount) as sum_amount
  from payments
  where status = 'active' and budget_id is not null
  group by budget_id
) p
where b.id = p.budget_id;

commit;
