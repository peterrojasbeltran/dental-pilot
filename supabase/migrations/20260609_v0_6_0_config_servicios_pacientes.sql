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
