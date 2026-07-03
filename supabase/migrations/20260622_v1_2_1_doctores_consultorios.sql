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
