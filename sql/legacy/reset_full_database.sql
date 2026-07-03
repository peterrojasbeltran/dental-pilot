-- Dental Pilot v1.3.2
-- Reinicio completo de datos operativos para iniciar un piloto limpio.
-- Conserva usuarios/auth y configuración general.
-- Reconstituye catálogos base: servicios, doctores, consultorios, insumos, categorías de egresos y plantillas.
-- La demo NO se afecta porque usa datos mock del código, no estas tablas.

begin;

-- 1) Limpiar datos operativos en orden seguro.
do $$
begin
  if to_regclass('public.automation_history') is not null then delete from public.automation_history; end if;
  if to_regclass('public.inventory_movements') is not null then delete from public.inventory_movements; end if;
  if to_regclass('public.payments') is not null then delete from public.payments; end if;
  if to_regclass('public.expenses') is not null then delete from public.expenses; end if;
  if to_regclass('public.budget_items') is not null then delete from public.budget_items; end if;
  if to_regclass('public.budgets') is not null then delete from public.budgets; end if;
  if to_regclass('public.treatment_services') is not null then delete from public.treatment_services; end if;
  if to_regclass('public.treatments') is not null then delete from public.treatments; end if;
  if to_regclass('public.appointments') is not null then delete from public.appointments; end if;
  if to_regclass('public.patients') is not null then delete from public.patients; end if;
end $$;

-- 2) Reiniciar catálogos base editables.
do $$
begin
  if to_regclass('public.services') is not null then delete from public.services; end if;
  if to_regclass('public.inventory_items') is not null then delete from public.inventory_items; end if;
  if to_regclass('public.expense_categories') is not null then delete from public.expense_categories; end if;
  if to_regclass('public.doctors') is not null then delete from public.doctors; end if;
  if to_regclass('public.consulting_rooms') is not null then delete from public.consulting_rooms; end if;
end $$;

-- 3) Configuración por defecto Bolivia.
insert into public.clinic_settings (clinic_name, country, currency_code, currency_symbol, locale, timezone, tax_enabled)
select 'Dental Pilot Bolivia', 'Bolivia', 'BOB', 'Bs', 'es-BO', 'America/La_Paz', false
where to_regclass('public.clinic_settings') is not null
  and not exists (select 1 from public.clinic_settings);

update public.clinic_settings
set country = 'Bolivia', currency_code = 'BOB', currency_symbol = 'Bs', locale = 'es-BO', timezone = 'America/La_Paz', tax_enabled = false
where to_regclass('public.clinic_settings') is not null;

-- 4) Servicios odontológicos base.
insert into public.services (name, description, category, price, duration_minutes, is_active)
select * from (values
  ('Limpieza dental', 'Profilaxis y limpieza preventiva.', 'Preventiva', 250::numeric, 45, true),
  ('Evaluación ortodoncia', 'Consulta inicial para valoración de ortodoncia.', 'Ortodoncia', 150::numeric, 30, true),
  ('Blanqueamiento', 'Tratamiento estético dental.', 'Estética', 900::numeric, 60, true),
  ('Extracción', 'Extracción dental simple.', 'Cirugía', 80::numeric, 60, true),
  ('Endodoncia', 'Tratamiento de conducto.', 'Endodoncia', 1500::numeric, 90, true)
) as seed(name, description, category, price, duration_minutes, is_active)
where to_regclass('public.services') is not null;

-- 5) Insumos base para consultorio pequeño.
insert into public.inventory_items (name, category, unit, current_stock, minimum_stock, is_active, notes)
select * from (values
  ('Guantes nitrilo', 'Bioseguridad', 'caja', 20::numeric, 20::numeric, true, 'Insumo de uso diario.'),
  ('Anestesia dental', 'Clínico', 'unidad', 10::numeric, 10::numeric, true, 'Revisar reposición semanal.'),
  ('Resina compuesta', 'Restauración', 'unidad', 24::numeric, 8::numeric, true, 'Material restaurativo.'),
  ('Cubrebocas', 'Bioseguridad', 'caja', 30::numeric, 15::numeric, true, 'Consumo moderado.')
) as seed(name, category, unit, current_stock, minimum_stock, is_active, notes)
where to_regclass('public.inventory_items') is not null;

-- 6) Categorías de egresos base.
insert into public.expense_categories (name, is_active)
select * from (values
  ('Laboratorio', true),
  ('Insumos', true),
  ('Mantenimiento', true),
  ('Servicios', true),
  ('Marketing', true),
  ('Personal', true),
  ('Otros', true)
) as seed(name, is_active)
where to_regclass('public.expense_categories') is not null;

-- 7) Doctores y consultorios base.
do $$
begin
  if to_regclass('public.doctors') is not null then
    insert into public.doctors (full_name, specialty, is_active, notes)
    values
      ('Dra. Camila Rojas', 'Odontología general', true, 'Doctora base para agenda inicial.'),
      ('Dr. Andrés Méndez', 'Ortodoncia', true, 'Doctor base para agenda inicial.'),
      ('Dra. Valeria Paz', 'Estética dental', true, 'Doctora base para agenda inicial.');
  end if;

  if to_regclass('public.consulting_rooms') is not null then
    insert into public.consulting_rooms (name, description, is_active, notes)
    values
      ('Consultorio 1', 'Atención general', true, 'Consultorio base.'),
      ('Consultorio 2', 'Ortodoncia', true, 'Consultorio base.'),
      ('Consultorio 3', 'Estética', true, 'Consultorio base.');
  end if;
end $$;

-- 8) Plantillas de automatización base, si existen las tablas.
do $$
begin
  if to_regclass('public.automation_rules') is not null then
    delete from public.automation_rules;
    insert into public.automation_rules (kind, title, description, is_enabled, trigger_label, timing_value, timing_unit)
    values
      ('appointment_reminder', 'Recordatorio de cita', 'Aviso antes de la cita para reducir inasistencias.', true, '24 horas antes de la cita', 24, 'hours'),
      ('budget_followup', 'Seguimiento de presupuesto', 'Mensaje para presupuestos enviados sin respuesta.', true, '3 días después de enviado', 3, 'days'),
      ('patient_recovery', 'Recuperación de pacientes', 'Reactivación de pacientes sin actividad reciente.', false, '90 días sin cita', 90, 'days'),
      ('birthday', 'Cumpleaños', 'Mensaje de cumpleaños para reforzar relación.', false, 'Día del cumpleaños', 0, 'days');
  end if;

  if to_regclass('public.automation_templates') is not null then
    delete from public.automation_templates;
    insert into public.automation_templates (kind, name, body, variables)
    values
      ('appointment_reminder', 'Recordatorio de cita', 'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}.', array['nombre','fecha','hora']),
      ('budget_followup', 'Seguimiento de presupuesto', 'Hola {{nombre}}, tu presupuesto de {{tratamiento}} sigue pendiente. ¿Te ayudamos con alguna duda?', array['nombre','tratamiento']),
      ('patient_recovery', 'Recuperación de paciente', 'Hola {{nombre}}, hace tiempo no vienes a control. Podemos ayudarte a agendar una revisión preventiva.', array['nombre']),
      ('birthday', 'Cumpleaños', '¡Feliz cumpleaños {{nombre}}! Te deseamos un excelente día.', array['nombre']);
  end if;
end $$;

commit;
