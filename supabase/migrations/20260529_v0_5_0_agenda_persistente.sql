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
