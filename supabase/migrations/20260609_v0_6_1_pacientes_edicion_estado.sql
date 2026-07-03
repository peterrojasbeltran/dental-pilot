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
