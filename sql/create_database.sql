-- Dental Pilot v2.0.5
-- Script de creación completa de base de datos.
-- Uso recomendado: ejecutar en una base Supabase nueva/vacía desde SQL Editor.
-- Incluye schema base + migraciones históricas idempotentes.
-- Importante: no ejecuta datos grandes de prueba. Para limpiar datos use sql/reset_clean_database.sql.
-- Nota: no se envuelve todo en una transacción para permitir migraciones históricas con BEGIN/COMMIT propios.

-- Dental Pilot v0.3.0
-- Ejecutar este SQL en Supabase SQL Editor.
-- Incluye configuración Bolivia, tablas base, CRM Kanban, RLS simple y datos demo.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null default 'Clínica Dental Demo',
  country text not null default 'Bolivia',
  currency_code text not null default 'BOB',
  currency_symbol text not null default 'Bs',
  locale text not null default 'es-BO',
  timezone text not null default 'America/La_Paz',
  tax_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','reception','doctor')) default 'reception',
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  source text default 'manual',
  status text not null check (status in ('new_lead','contacted','scheduled','attended','in_treatment','inactive','recovery','finished')) default 'new_lead',
  risk_level text not null check (risk_level in ('low','medium','high')) default 'low',
  notes text,
  last_contact_at timestamptz,
  active_treatment text,
  estimated_value numeric(12,2) default 0,
  ai_summary text,
  next_action text,
  created_at timestamptz not null default now()
);

-- Compatibilidad para proyectos creados con v0.2.x.
alter table patients add column if not exists last_contact_at timestamptz;
alter table patients add column if not exists active_treatment text;
alter table patients add column if not exists estimated_value numeric(12,2) default 0;
alter table patients add column if not exists ai_summary text;
alter table patients add column if not exists next_action text;
alter table patients add column if not exists is_active boolean not null default true;
alter table patients add column if not exists updated_at timestamptz not null default now();

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  duration_minutes int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  service_id uuid references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('scheduled','confirmed','pending','in_progress','cancelled','completed','no_show')) default 'scheduled',
  doctor_name text,
  room_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists treatments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  title text not null,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status text not null check (status in ('pending','partial','approved','finished','cancelled')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  treatment_id uuid references treatments(id) on delete set null,
  amount numeric(12,2) not null,
  method text not null default 'cash',
  paid_at timestamptz not null default now(),
  notes text
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  unit text not null default 'unidad',
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  channel text not null default 'whatsapp',
  message text not null,
  direction text not null check (direction in ('inbound','outbound')),
  summary text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists ai_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete set null,
  task_type text not null,
  input jsonb not null,
  output jsonb,
  model text,
  latency_ms int,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  estimated_cost_usd numeric(12,6),
  created_at timestamptz not null default now()
);

alter table clinic_settings enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table treatments enable row level security;
alter table payments enable row level security;
alter table inventory_items enable row level security;
alter table conversations enable row level security;
alter table ai_logs enable row level security;

-- Políticas simples para MVP single-clinic: cualquier usuario autenticado puede operar.
-- En una futura versión multi-clínica se agregará clinic_id y políticas por tenant.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'patients' and policyname = 'authenticated_read_patients') then
    create policy authenticated_read_patients on patients for select to authenticated using (true);
    create policy authenticated_write_patients on patients for all to authenticated using (true) with check (true);
    create policy authenticated_read_services on services for select to authenticated using (true);
    create policy authenticated_write_services on services for all to authenticated using (true) with check (true);
    create policy authenticated_read_appointments on appointments for select to authenticated using (true);
    create policy authenticated_write_appointments on appointments for all to authenticated using (true) with check (true);
    create policy authenticated_read_clinic_settings on clinic_settings for select to authenticated using (true);
    create policy authenticated_write_clinic_settings on clinic_settings for all to authenticated using (true) with check (true);
    create policy authenticated_read_profiles on profiles for select to authenticated using (true);
    create policy authenticated_write_profiles on profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
    create policy authenticated_all_treatments on treatments for all to authenticated using (true) with check (true);
    create policy authenticated_all_payments on payments for all to authenticated using (true) with check (true);
    create policy authenticated_all_inventory on inventory_items for all to authenticated using (true) with check (true);
    create policy authenticated_all_conversations on conversations for all to authenticated using (true) with check (true);
    create policy authenticated_all_ai_logs on ai_logs for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into clinic_settings (clinic_name, country, currency_code, currency_symbol, locale, timezone)
select 'Clínica Dental Demo', 'Bolivia', 'BOB', 'Bs', 'es-BO', 'America/La_Paz'
where not exists (select 1 from clinic_settings);

insert into services (name, description, price, duration_minutes)
select * from (values
  ('Limpieza dental', 'Profilaxis y limpieza preventiva.', 250.00, 45),
  ('Evaluación ortodoncia', 'Consulta inicial para ortodoncia.', 150.00, 30),
  ('Blanqueamiento', 'Tratamiento estético dental.', 900.00, 60)
) as seed(name, description, price, duration_minutes)
where not exists (select 1 from services);

insert into patients (full_name, phone, email, source, status, risk_level, notes, last_contact_at, active_treatment, estimated_value, ai_summary, next_action)
select * from (values
  ('Ana Martínez', '+591 70000001', 'ana@email.com', 'WhatsApp', 'scheduled', 'low', 'Interesada en limpieza dental.', now() - interval '1 day', 'Limpieza dental', 250.00, 'Paciente con intención clara. Ya aceptó horario tentativo.', 'Confirmar asistencia 24 horas antes de la cita.'),
  ('Luis Roca', '+591 70000002', null, 'Instagram', 'new_lead', 'medium', 'Pidió precio de ortodoncia.', now() - interval '2 days', 'Evaluación ortodoncia', 3500.00, 'Lead de alto valor con objeción probable de precio.', 'Enviar mensaje con beneficios y horarios disponibles.'),
  ('María Suárez', '+591 70000003', null, 'Recepción', 'recovery', 'high', 'No volvió a control hace 45 días.', now() - interval '45 days', 'Implante dental', 7000.00, 'Paciente en riesgo alto por abandono de tratamiento.', 'Contactar con tono empático y ofrecer reprogramación.'),
  ('Carlos Méndez', '+591 70000004', 'carlos@email.com', 'Referido', 'contacted', 'low', 'Consultó por blanqueamiento.', now() - interval '1 day', 'Blanqueamiento', 900.00, 'Interés estético con fecha objetivo.', 'Ofrecer dos horarios esta semana.'),
  ('Sofía Vargas', '+591 70000005', null, 'WhatsApp', 'attended', 'low', 'Asistió a evaluación.', now(), 'Caries múltiples', 1200.00, 'Ya asistió. Falta cerrar presupuesto.', 'Enviar presupuesto y solicitar confirmación.'),
  ('Jorge Camacho', '+591 70000006', null, 'Campaña', 'in_treatment', 'medium', 'Ortodoncia activa con control atrasado.', now() - interval '10 days', 'Ortodoncia', 3500.00, 'Paciente activo con señal temprana de riesgo.', 'Recordar control pendiente y ofrecer horarios.'),
  ('Paola Gutiérrez', '+591 70000007', 'paola@email.com', 'Google Maps', 'inactive', 'high', 'Canceló dos veces su cita.', now() - interval '18 days', 'Endodoncia', 1800.00, 'Riesgo alto por cancelaciones repetidas.', 'Enviar recuperación con opción de reagendar.'),
  ('Ricardo Paz', '+591 70000008', null, 'WhatsApp', 'finished', 'low', 'Finalizó limpieza.', now() - interval '7 days', 'Control preventivo', 250.00, 'Paciente finalizado para recordatorio futuro.', 'Programar recordatorio de control semestral.')
) as seed(full_name, phone, email, source, status, risk_level, notes, last_contact_at, active_treatment, estimated_value, ai_summary, next_action)
where not exists (select 1 from patients);

insert into appointments (patient_id, service_id, starts_at, ends_at, status, doctor_name, room_name, notes)
select p.id, s.id, now() + interval '1 hour', now() + interval '1 hour 45 minutes', 'confirmed', 'Dra. Camila Rojas', 'Consultorio 1', 'Cita demo generada por seed.'
from patients p cross join services s
where p.full_name = 'Ana Martínez' and s.name = 'Limpieza dental'
and not exists (select 1 from appointments);



-- ============================================================
-- Migration: 20260529_v0_5_0_agenda_persistente.sql
-- ============================================================
-- Dental Pilot v0.5.0
-- Agenda persistente: agrega doctor, consultorio y estado En curso.
-- Seguro para ejecutar sobre la base existente de v0.4.x.

alter table appointments
  add column if not exists doctor_name text,
  add column if not exists room_name text;

-- Reemplaza la restricción de estados para permitir "in_progress".
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'appointments'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if constraint_name is not null then
    execute format('alter table appointments drop constraint %I', constraint_name);
  end if;
end $$;

alter table appointments
  add constraint appointments_status_check
  check (status in ('scheduled','confirmed','pending','in_progress','cancelled','completed','no_show'));

update appointments
set doctor_name = coalesce(doctor_name, 'Dra. Camila Rojas'),
    room_name = coalesce(room_name, 'Consultorio 1')
where doctor_name is null or room_name is null;



-- ============================================================
-- Migration: 20260609_v0_6_0_config_servicios_pacientes.sql
-- ============================================================
-- Dental Pilot v0.6.0
-- Configuración editable, servicios administrables y pacientes mejorados.
-- Ejecutar después de las migraciones anteriores.

-- Configuración de clínica ampliada.
alter table clinic_settings
  add column if not exists legal_name text,
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists city text;

-- Servicios con categoría.
alter table services
  add column if not exists category text default 'Otros';

-- Pacientes con datos separados y fecha de nacimiento.
alter table patients
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date;

-- Catálogos base para V1.
create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists patient_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table service_categories enable row level security;
alter table patient_sources enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'service_categories' and policyname = 'authenticated_all_service_categories') then
    create policy authenticated_all_service_categories on service_categories for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'patient_sources' and policyname = 'authenticated_all_patient_sources') then
    create policy authenticated_all_patient_sources on patient_sources for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into service_categories (name)
select * from (values ('Preventiva'), ('Estética'), ('Ortodoncia'), ('Endodoncia'), ('Cirugía'), ('Otros')) as seed(name)
on conflict (name) do nothing;

insert into patient_sources (name)
select * from (values ('WhatsApp'), ('Instagram'), ('Facebook'), ('Referido'), ('Visita directa'), ('Google Maps'), ('Otro')) as seed(name)
on conflict (name) do nothing;

-- Normaliza categorías existentes.
update services set category = 'Preventiva' where category is null and lower(name) like '%limpieza%';
update services set category = 'Ortodoncia' where category is null and lower(name) like '%ortodoncia%';
update services set category = 'Estética' where category is null and lower(name) like '%blanqueamiento%';
update services set category = 'Otros' where category is null;

-- Carga nombres/apellidos básicos para pacientes existentes cuando sea posible.
update patients
set first_name = split_part(full_name, ' ', 1),
    last_name = nullif(trim(replace(full_name, split_part(full_name, ' ', 1), '')), '')
where first_name is null;

-- Evita duplicidad por teléfono para la V1 single-clinic.
do $$
begin
  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'patients_phone_unique_idx') then
    create unique index patients_phone_unique_idx on patients (phone);
  end if;
exception
  when unique_violation then
    raise notice 'No se pudo crear índice único de teléfono porque existen pacientes duplicados. Limpia duplicados y vuelve a ejecutar este bloque.';
end $$;



-- ============================================================
-- Migration: 20260609_v0_6_1_pacientes_edicion_estado.sql
-- ============================================================
-- Dental Pilot v0.6.1
-- Pacientes: edición completa, activación/desactivación y actualización de timestamp.
-- Ejecutar después de 20260609_v0_6_0_config_servicios_pacientes.sql.

alter table patients
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- Asegura que pacientes existentes queden activos por defecto.
update patients set is_active = true where is_active is null;

-- Índice de apoyo para búsquedas operativas por estado activo.
create index if not exists patients_is_active_idx on patients (is_active);

-- Mantiene updated_at cuando el registro cambia.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'patients_set_updated_at'
  ) then
    create trigger patients_set_updated_at
    before update on patients
    for each row execute function set_updated_at();
  end if;
end $$;



-- ============================================================
-- Migration: 20260609_v0_7_0_tratamientos_presupuestos.sql
-- ============================================================
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



-- ============================================================
-- Migration: 20260615_v0_7_7_global_search_notes.sql
-- ============================================================
-- Dental Pilot v0.7.7
-- Búsqueda global no requiere cambios de estructura.
-- Este archivo deja trazabilidad de versión para la carpeta de migraciones.
-- No ejecutar cambios destructivos aquí.

select 'Dental Pilot v0.7.7 - Global Search no requiere migración estructural' as note;



-- ============================================================
-- Migration: 20260615_v0_9_0_pagos_ingresos.sql
-- ============================================================
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



-- ============================================================
-- Migration: 20260622_v1_0_0_automatizaciones.sql
-- ============================================================
-- Dental Pilot v1.0.0
-- Motor de automatizaciones. No envía mensajes reales todavía.

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('appointment_reminder', 'budget_followup', 'patient_recovery', 'birthday')),
  title text not null,
  description text not null,
  is_enabled boolean not null default false,
  trigger_label text not null,
  timing_value integer not null default 0,
  timing_unit text not null default 'days' check (timing_unit in ('hours', 'days', 'months')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique references automation_rules(kind) on delete cascade,
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_history (
  id uuid primary key default gen_random_uuid(),
  kind text not null references automation_rules(kind) on delete cascade,
  patient_id uuid null references patients(id) on delete set null,
  patient_name text not null,
  target_label text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'simulated', 'sent', 'failed')),
  channel text not null default 'simulation' check (channel in ('whatsapp', 'manual', 'simulation')),
  scheduled_for timestamptz null,
  sent_at timestamptz null,
  message_preview text not null,
  created_at timestamptz not null default now()
);

insert into automation_rules (kind, title, description, is_enabled, trigger_label, timing_value, timing_unit)
values
  ('appointment_reminder', 'Recordatorio de cita', 'Aviso antes de la cita para reducir inasistencias.', true, '24 horas antes de la cita', 24, 'hours'),
  ('budget_followup', 'Seguimiento de presupuesto', 'Mensaje para presupuestos enviados y sin respuesta.', true, '3 días después de enviado', 3, 'days'),
  ('patient_recovery', 'Recuperación de pacientes', 'Reactivación de pacientes sin actividad reciente.', false, '90 días sin cita', 90, 'days'),
  ('birthday', 'Cumpleaños', 'Mensaje de cumpleaños para reforzar relación con el paciente.', false, 'Día del cumpleaños', 0, 'days')
on conflict (kind) do nothing;

insert into automation_templates (kind, name, body, variables)
values
  ('appointment_reminder', 'Recordatorio de cita', 'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. Responde CONFIRMAR para confirmar tu asistencia.', array['nombre','fecha','hora']),
  ('budget_followup', 'Seguimiento de presupuesto', 'Hola {{nombre}}, tu presupuesto de {{tratamiento}} sigue pendiente. ¿Quieres que te ayudemos a resolver alguna duda?', array['nombre','tratamiento']),
  ('patient_recovery', 'Recuperación de paciente', 'Hola {{nombre}}, hace tiempo no vienes a control. Podemos ayudarte a agendar una revisión preventiva esta semana.', array['nombre']),
  ('birthday', 'Cumpleaños', '¡Feliz cumpleaños {{nombre}}! Te deseamos un excelente día de parte de Dental Pilot.', array['nombre'])
on conflict (kind) do nothing;



-- ============================================================
-- Migration: 20260622_v1_1_0_inventario_basico.sql
-- ============================================================
-- Dental Pilot v1.1.1
-- Hotfix inventario básico.
-- Hace la migración idempotente para bases donde inventory_items ya existía con columnas antiguas.

create extension if not exists pgcrypto;

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table inventory_items add column if not exists category text;
alter table inventory_items add column if not exists unit text default 'unidad';
alter table inventory_items add column if not exists current_stock numeric default 0;
alter table inventory_items add column if not exists minimum_stock numeric default 0;
alter table inventory_items add column if not exists is_active boolean default true;
alter table inventory_items add column if not exists notes text;
alter table inventory_items add column if not exists updated_at timestamptz default now();

-- Compatibilidad con schema antiguo: quantity/min_quantity.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_items' and column_name = 'quantity'
  ) then
    update inventory_items
    set current_stock = coalesce(current_stock, quantity, 0)
    where current_stock is null or current_stock = 0;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_items' and column_name = 'min_quantity'
  ) then
    update inventory_items
    set minimum_stock = coalesce(minimum_stock, min_quantity, 0)
    where minimum_stock is null or minimum_stock = 0;
  end if;
end $$;

update inventory_items set unit = coalesce(nullif(unit, ''), 'unidad');
update inventory_items set current_stock = coalesce(current_stock, 0);
update inventory_items set minimum_stock = coalesce(minimum_stock, 0);
update inventory_items set is_active = coalesce(is_active, true);
update inventory_items set updated_at = coalesce(updated_at, now());

alter table inventory_items alter column unit set not null;
alter table inventory_items alter column unit set default 'unidad';
alter table inventory_items alter column current_stock set not null;
alter table inventory_items alter column current_stock set default 0;
alter table inventory_items alter column minimum_stock set not null;
alter table inventory_items alter column minimum_stock set default 0;
alter table inventory_items alter column is_active set not null;
alter table inventory_items alter column is_active set default true;
alter table inventory_items alter column updated_at set not null;
alter table inventory_items alter column updated_at set default now();

-- Checks defensivos.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_items_current_stock_nonnegative') then
    alter table inventory_items add constraint inventory_items_current_stock_nonnegative check (current_stock >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_items_minimum_stock_nonnegative') then
    alter table inventory_items add constraint inventory_items_minimum_stock_nonnegative check (minimum_stock >= 0);
  end if;
end $$;

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table inventory_movements add column if not exists movement_type text default 'adjustment';
alter table inventory_movements add column if not exists reason text default 'adjustment';
alter table inventory_movements add column if not exists quantity numeric default 1;
alter table inventory_movements add column if not exists previous_stock numeric default 0;
alter table inventory_movements add column if not exists new_stock numeric default 0;
alter table inventory_movements add column if not exists notes text;

update inventory_movements set movement_type = coalesce(movement_type, 'adjustment');
update inventory_movements set reason = coalesce(reason, 'adjustment');
update inventory_movements set quantity = coalesce(quantity, 1);
update inventory_movements set previous_stock = coalesce(previous_stock, 0);
update inventory_movements set new_stock = coalesce(new_stock, 0);

alter table inventory_movements alter column item_id set not null;
alter table inventory_movements alter column movement_type set not null;
alter table inventory_movements alter column movement_type set default 'adjustment';
alter table inventory_movements alter column reason set not null;
alter table inventory_movements alter column reason set default 'adjustment';
alter table inventory_movements alter column quantity set not null;
alter table inventory_movements alter column quantity set default 1;
alter table inventory_movements alter column previous_stock set not null;
alter table inventory_movements alter column previous_stock set default 0;
alter table inventory_movements alter column new_stock set not null;
alter table inventory_movements alter column new_stock set default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_type_check') then
    alter table inventory_movements add constraint inventory_movements_type_check check (movement_type in ('in', 'out', 'adjustment'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_reason_check') then
    alter table inventory_movements add constraint inventory_movements_reason_check check (reason in ('purchase', 'consumption', 'loss', 'adjustment'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_quantity_positive') then
    alter table inventory_movements add constraint inventory_movements_quantity_positive check (quantity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_previous_stock_nonnegative') then
    alter table inventory_movements add constraint inventory_movements_previous_stock_nonnegative check (previous_stock >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_new_stock_nonnegative') then
    alter table inventory_movements add constraint inventory_movements_new_stock_nonnegative check (new_stock >= 0);
  end if;
end $$;

create index if not exists idx_inventory_items_active on inventory_items(is_active);
create index if not exists idx_inventory_items_low_stock on inventory_items(current_stock, minimum_stock);
create index if not exists idx_inventory_movements_item_created on inventory_movements(item_id, created_at desc);

alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_items' and policyname = 'authenticated_all_inventory_items') then
    create policy authenticated_all_inventory_items on inventory_items for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_movements' and policyname = 'authenticated_all_inventory_movements') then
    create policy authenticated_all_inventory_movements on inventory_movements for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into inventory_items (name, category, unit, current_stock, minimum_stock, notes)
select * from (values
  ('Guantes nitrilo', 'Bioseguridad', 'caja', 15, 20, 'Uso diario en consultorio.'),
  ('Anestesia dental', 'Clínico', 'unidad', 8, 10, 'Revisar reposición semanal.'),
  ('Resina compuesta', 'Restauración', 'unidad', 24, 8, 'Stock suficiente.'),
  ('Cubrebocas', 'Bioseguridad', 'caja', 30, 15, 'Consumo moderado.')
) as seed(name, category, unit, current_stock, minimum_stock, notes)
where not exists (select 1 from inventory_items);



-- ============================================================
-- Migration: 20260622_v1_1_1_inventory_hotfix.sql
-- ============================================================
-- Dental Pilot v1.1.1
-- Hotfix inventario básico.
-- Hace la migración idempotente para bases donde inventory_items ya existía con columnas antiguas.

create extension if not exists pgcrypto;

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table inventory_items add column if not exists category text;
alter table inventory_items add column if not exists unit text default 'unidad';
alter table inventory_items add column if not exists current_stock numeric default 0;
alter table inventory_items add column if not exists minimum_stock numeric default 0;
alter table inventory_items add column if not exists is_active boolean default true;
alter table inventory_items add column if not exists notes text;
alter table inventory_items add column if not exists updated_at timestamptz default now();

-- Compatibilidad con schema antiguo: quantity/min_quantity.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_items' and column_name = 'quantity'
  ) then
    update inventory_items
    set current_stock = coalesce(current_stock, quantity, 0)
    where current_stock is null or current_stock = 0;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_items' and column_name = 'min_quantity'
  ) then
    update inventory_items
    set minimum_stock = coalesce(minimum_stock, min_quantity, 0)
    where minimum_stock is null or minimum_stock = 0;
  end if;
end $$;

update inventory_items set unit = coalesce(nullif(unit, ''), 'unidad');
update inventory_items set current_stock = coalesce(current_stock, 0);
update inventory_items set minimum_stock = coalesce(minimum_stock, 0);
update inventory_items set is_active = coalesce(is_active, true);
update inventory_items set updated_at = coalesce(updated_at, now());

alter table inventory_items alter column unit set not null;
alter table inventory_items alter column unit set default 'unidad';
alter table inventory_items alter column current_stock set not null;
alter table inventory_items alter column current_stock set default 0;
alter table inventory_items alter column minimum_stock set not null;
alter table inventory_items alter column minimum_stock set default 0;
alter table inventory_items alter column is_active set not null;
alter table inventory_items alter column is_active set default true;
alter table inventory_items alter column updated_at set not null;
alter table inventory_items alter column updated_at set default now();

-- Checks defensivos.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_items_current_stock_nonnegative') then
    alter table inventory_items add constraint inventory_items_current_stock_nonnegative check (current_stock >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_items_minimum_stock_nonnegative') then
    alter table inventory_items add constraint inventory_items_minimum_stock_nonnegative check (minimum_stock >= 0);
  end if;
end $$;

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table inventory_movements add column if not exists movement_type text default 'adjustment';
alter table inventory_movements add column if not exists reason text default 'adjustment';
alter table inventory_movements add column if not exists quantity numeric default 1;
alter table inventory_movements add column if not exists previous_stock numeric default 0;
alter table inventory_movements add column if not exists new_stock numeric default 0;
alter table inventory_movements add column if not exists notes text;

update inventory_movements set movement_type = coalesce(movement_type, 'adjustment');
update inventory_movements set reason = coalesce(reason, 'adjustment');
update inventory_movements set quantity = coalesce(quantity, 1);
update inventory_movements set previous_stock = coalesce(previous_stock, 0);
update inventory_movements set new_stock = coalesce(new_stock, 0);

alter table inventory_movements alter column item_id set not null;
alter table inventory_movements alter column movement_type set not null;
alter table inventory_movements alter column movement_type set default 'adjustment';
alter table inventory_movements alter column reason set not null;
alter table inventory_movements alter column reason set default 'adjustment';
alter table inventory_movements alter column quantity set not null;
alter table inventory_movements alter column quantity set default 1;
alter table inventory_movements alter column previous_stock set not null;
alter table inventory_movements alter column previous_stock set default 0;
alter table inventory_movements alter column new_stock set not null;
alter table inventory_movements alter column new_stock set default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_type_check') then
    alter table inventory_movements add constraint inventory_movements_type_check check (movement_type in ('in', 'out', 'adjustment'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_reason_check') then
    alter table inventory_movements add constraint inventory_movements_reason_check check (reason in ('purchase', 'consumption', 'loss', 'adjustment'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_quantity_positive') then
    alter table inventory_movements add constraint inventory_movements_quantity_positive check (quantity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_previous_stock_nonnegative') then
    alter table inventory_movements add constraint inventory_movements_previous_stock_nonnegative check (previous_stock >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inventory_movements_new_stock_nonnegative') then
    alter table inventory_movements add constraint inventory_movements_new_stock_nonnegative check (new_stock >= 0);
  end if;
end $$;

create index if not exists idx_inventory_items_active on inventory_items(is_active);
create index if not exists idx_inventory_items_low_stock on inventory_items(current_stock, minimum_stock);
create index if not exists idx_inventory_movements_item_created on inventory_movements(item_id, created_at desc);

alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_items' and policyname = 'authenticated_all_inventory_items') then
    create policy authenticated_all_inventory_items on inventory_items for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_movements' and policyname = 'authenticated_all_inventory_movements') then
    create policy authenticated_all_inventory_movements on inventory_movements for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into inventory_items (name, category, unit, current_stock, minimum_stock, notes)
select * from (values
  ('Guantes nitrilo', 'Bioseguridad', 'caja', 15, 20, 'Uso diario en consultorio.'),
  ('Anestesia dental', 'Clínico', 'unidad', 8, 10, 'Revisar reposición semanal.'),
  ('Resina compuesta', 'Restauración', 'unidad', 24, 8, 'Stock suficiente.'),
  ('Cubrebocas', 'Bioseguridad', 'caja', 30, 15, 'Consumo moderado.')
) as seed(name, category, unit, current_stock, minimum_stock, notes)
where not exists (select 1 from inventory_items);



-- ============================================================
-- Migration: 20260622_v1_2_0_ai_assistant_notes.sql
-- ============================================================
-- Dental Pilot v1.2.0
-- AI Assistant no requiere cambios estructurales.
-- Para reiniciar datos operativos y dejar catálogos base, ejecutar:
-- sql/reset_full_database.sql
select 'Dental Pilot v1.2.0: sin migración estructural requerida' as message;



-- ============================================================
-- Migration: 20260622_v1_2_1_doctores_consultorios.sql
-- ============================================================
-- Dental Pilot v1.2.1
-- Configuración operativa: doctores y consultorios administrables.
-- La agenda seguirá guardando doctor_name y room_name para compatibilidad con versiones anteriores.

create extension if not exists pgcrypto;

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text null,
  email text null,
  phone text null,
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table doctors add column if not exists specialty text;
alter table doctors add column if not exists email text;
alter table doctors add column if not exists phone text;
alter table doctors add column if not exists is_active boolean default true;
alter table doctors add column if not exists notes text;
alter table doctors add column if not exists created_at timestamptz default now();
alter table doctors add column if not exists updated_at timestamptz default now();

update doctors set is_active = coalesce(is_active, true);
update doctors set created_at = coalesce(created_at, now());
update doctors set updated_at = coalesce(updated_at, now());

alter table doctors alter column is_active set not null;
alter table doctors alter column is_active set default true;
alter table doctors alter column created_at set not null;
alter table doctors alter column created_at set default now();
alter table doctors alter column updated_at set not null;
alter table doctors alter column updated_at set default now();

create table if not exists consulting_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table consulting_rooms add column if not exists description text;
alter table consulting_rooms add column if not exists is_active boolean default true;
alter table consulting_rooms add column if not exists notes text;
alter table consulting_rooms add column if not exists created_at timestamptz default now();
alter table consulting_rooms add column if not exists updated_at timestamptz default now();

update consulting_rooms set is_active = coalesce(is_active, true);
update consulting_rooms set created_at = coalesce(created_at, now());
update consulting_rooms set updated_at = coalesce(updated_at, now());

alter table consulting_rooms alter column is_active set not null;
alter table consulting_rooms alter column is_active set default true;
alter table consulting_rooms alter column created_at set not null;
alter table consulting_rooms alter column created_at set default now();
alter table consulting_rooms alter column updated_at set not null;
alter table consulting_rooms alter column updated_at set default now();

create index if not exists idx_doctors_active on doctors(is_active);
create index if not exists idx_doctors_full_name on doctors(full_name);
create index if not exists idx_consulting_rooms_active on consulting_rooms(is_active);
create index if not exists idx_consulting_rooms_name on consulting_rooms(name);

alter table doctors enable row level security;
alter table consulting_rooms enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'doctors' and policyname = 'authenticated_all_doctors') then
    create policy authenticated_all_doctors on doctors for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'consulting_rooms' and policyname = 'authenticated_all_consulting_rooms') then
    create policy authenticated_all_consulting_rooms on consulting_rooms for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into doctors (full_name, specialty, email, phone, is_active, notes)
select * from (values
  ('Dra. Camila Rojas', 'Odontología general', null::text, null::text, true, 'Doctora base para agenda inicial.'),
  ('Dr. Andrés Méndez', 'Ortodoncia', null::text, null::text, true, 'Doctor base para agenda inicial.'),
  ('Dra. Valeria Paz', 'Estética dental', null::text, null::text, true, 'Doctora base para agenda inicial.')
) as seed(full_name, specialty, email, phone, is_active, notes)
where not exists (select 1 from doctors);

insert into consulting_rooms (name, description, is_active, notes)
select * from (values
  ('Consultorio 1', 'Atención general', true, 'Consultorio base.'),
  ('Consultorio 2', 'Ortodoncia', true, 'Consultorio base.'),
  ('Consultorio 3', 'Estética', true, 'Consultorio base.')
) as seed(name, description, is_active, notes)
where not exists (select 1 from consulting_rooms);



-- ============================================================
-- Migration: 20260622_v1_3_0_finanzas_basicas.sql
-- ============================================================
-- Dental Pilot v1.3.0
-- Finanzas básicas: egresos simples para consultorio pequeño.
-- No incluye impuestos, proveedores, órdenes de compra ni contabilidad avanzada.

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
alter table expenses add column if not exists created_at timestamptz default now();

update expenses set expense_date = coalesce(expense_date, current_date), payment_method = coalesce(payment_method, 'qr'), created_at = coalesce(created_at, now());

alter table expenses alter column expense_date set not null;
alter table expenses alter column expense_date set default current_date;
alter table expenses alter column description set not null;
alter table expenses alter column amount set not null;
alter table expenses alter column payment_method set not null;
alter table expenses alter column payment_method set default 'qr';
alter table expenses alter column created_at set not null;
alter table expenses alter column created_at set default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_amount_positive') then
    alter table expenses add constraint expenses_amount_positive check (amount > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expenses_payment_method_check') then
    alter table expenses add constraint expenses_payment_method_check check (payment_method in ('cash', 'qr', 'transfer', 'card'));
  end if;
end $$;

create index if not exists idx_expenses_date on expenses(expense_date desc);
create index if not exists idx_expenses_category on expenses(category_id);
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
on conflict (name) do nothing;



-- ============================================================
-- Migration: 20260622_v1_3_1_finanzas_egresos_gobernanza.sql
-- ============================================================
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



-- ============================================================
-- Migration: 20260623_v1_3_2_auditoria_hardening.sql
-- ============================================================
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

