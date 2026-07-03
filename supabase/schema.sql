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
