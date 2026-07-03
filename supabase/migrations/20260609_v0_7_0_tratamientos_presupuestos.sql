-- Dental Pilot v0.7.0
-- Tratamientos + Presupuestos.
-- Ejecutar después de v0.6.1/v0.6.0.
-- No elimina datos existentes. Adapta la tabla treatments previa del MVP.

-- 1) Permitir el nuevo estado CRM "budgeted" / Presupuestado.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'patients'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table patients drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table patients
  add constraint patients_status_check check (status in ('new_lead','contacted','scheduled','attended','budgeted','in_treatment','inactive','recovery','finished'));

-- 2) Evolucionar treatments para soportar plan clínico/comercial.
alter table treatments
  add column if not exists notes text,
  add column if not exists start_date date,
  add column if not exists estimated_end_date date;

-- La tabla antigua tenía status más limitado. Se reemplaza el check para la nueva V1.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'treatments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table treatments drop constraint if exists %I', constraint_name);
  end loop;
end $$;

update treatments set status = 'in_progress' where status = 'partial';
update treatments set status = 'finished' where status = 'finished';
update treatments set status = 'cancelled' where status = 'cancelled';
update treatments set status = 'pending' where status is null;

alter table treatments
  add constraint treatments_status_check check (status in ('pending','budgeted','approved','in_progress','finished','cancelled'));

-- 3) Servicios asociados a tratamientos.
create table if not exists treatment_services (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references treatments(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Presupuestos y detalle.
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references treatments(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','sent','approved','rejected','expired')),
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table treatment_services enable row level security;
alter table budgets enable row level security;
alter table budget_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'treatment_services' and policyname = 'authenticated_all_treatment_services') then
    create policy authenticated_all_treatment_services on treatment_services for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'budgets' and policyname = 'authenticated_all_budgets') then
    create policy authenticated_all_budgets on budgets for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'budget_items' and policyname = 'authenticated_all_budget_items') then
    create policy authenticated_all_budget_items on budget_items for all to authenticated using (true) with check (true);
  end if;
end $$;

create index if not exists treatment_services_treatment_idx on treatment_services(treatment_id);
create index if not exists budgets_patient_idx on budgets(patient_id);
create index if not exists budgets_treatment_idx on budgets(treatment_id);
create index if not exists budget_items_budget_idx on budget_items(budget_id);
