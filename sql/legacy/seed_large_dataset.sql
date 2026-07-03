-- Dental Pilot v1.3.3
-- Dataset grande para pruebas de regresión/performance.
-- Recomendación: ejecutar después de sql/reset_full_database.sql.
-- No afecta la demo pública porque la demo usa datos mock del código.

begin;

-- Asegurar servicios base.
insert into public.services (name, description, category, price, duration_minutes, is_active)
select * from (values
  ('Limpieza dental', 'Profilaxis y limpieza preventiva.', 'Preventiva', 250::numeric, 45, true),
  ('Evaluación ortodoncia', 'Consulta inicial para ortodoncia.', 'Ortodoncia', 150::numeric, 30, true),
  ('Blanqueamiento', 'Tratamiento estético dental.', 'Estética', 900::numeric, 60, true),
  ('Extracción', 'Extracción dental simple.', 'Cirugía', 80::numeric, 60, true),
  ('Endodoncia', 'Tratamiento de conducto.', 'Endodoncia', 1500::numeric, 90, true)
) as seed(name, description, category, price, duration_minutes, is_active)
where to_regclass('public.services') is not null
on conflict do nothing;

-- 100 pacientes.
insert into public.patients (full_name, phone, email, source, status, risk_level, notes, last_contact_at, active_treatment, estimated_value, ai_summary, next_action, is_active)
select
  'Paciente QA ' || gs,
  '+591 77' || lpad(gs::text, 6, '0'),
  'paciente.qa.' || gs || '@demo.com',
  case when gs % 4 = 0 then 'WhatsApp' when gs % 4 = 1 then 'Instagram' when gs % 4 = 2 then 'Referido' else 'Recepción' end,
  (array['new_lead','contacted','scheduled','budgeted','in_treatment','recovery','finished'])[1 + (gs % 7)],
  (array['low','medium','high'])[1 + (gs % 3)],
  'Paciente generado para pruebas de volumen.',
  now() - ((gs % 120) || ' days')::interval,
  (array['Limpieza dental','Ortodoncia','Endodoncia','Blanqueamiento'])[1 + (gs % 4)],
  (100 + (gs % 10) * 250)::numeric,
  'Resumen QA generado automáticamente.',
  'Validar seguimiento operativo.',
  true
from generate_series(1,100) gs
where to_regclass('public.patients') is not null
on conflict do nothing;

-- 300 citas distribuidas desde 30 días atrás hasta 60 días adelante.
insert into public.appointments (patient_id, service_id, starts_at, ends_at, status, doctor_name, room_name, notes)
select
  p.id,
  s.id,
  (date_trunc('day', now()) + (((gs % 90) - 30) || ' days')::interval + ((8 + (gs % 9)) || ' hours')::interval),
  (date_trunc('day', now()) + (((gs % 90) - 30) || ' days')::interval + ((9 + (gs % 9)) || ' hours')::interval),
  (array['pending','scheduled','confirmed','completed','cancelled','no_show'])[1 + (gs % 6)],
  (array['Dra. Camila Rojas','Dr. Andrés Méndez','Dra. Valeria Paz'])[1 + (gs % 3)],
  (array['Consultorio 1','Consultorio 2','Consultorio 3'])[1 + (gs % 3)],
  'Cita QA para pruebas de agenda.'
from generate_series(1,300) gs
join lateral (select id from public.patients order by id offset (gs % 100) limit 1) p on true
join lateral (select id from public.services order by id offset (gs % greatest((select count(*) from public.services),1)) limit 1) s on true
where to_regclass('public.appointments') is not null
on conflict do nothing;

-- 80 tratamientos y presupuestos.
do $$
declare
  r record;
  v_treatment_id uuid;
  v_budget_id uuid;
  service_record record;
  idx int := 0;
  subtotal numeric := 0;
begin
  if to_regclass('public.treatments') is null or to_regclass('public.budgets') is null then
    return;
  end if;

  for r in select id from public.patients order by created_at limit 80 loop
    idx := idx + 1;
    insert into public.treatments (patient_id, title, total_amount, paid_amount, status, notes, start_date, estimated_end_date)
    values (r.id, 'Plan QA ' || idx, 0, 0, (array['pending','budgeted','approved','in_progress','finished'])[1 + (idx % 5)], 'Tratamiento generado para QA.', current_date - (idx % 20), current_date + (idx % 60))
    returning id into v_treatment_id;

    subtotal := 0;
    for service_record in select id, name, price from public.services order by name limit (1 + (idx % 3)) loop
      insert into public.treatment_services (treatment_id, service_id, quantity, unit_price, total_price)
      values (v_treatment_id, service_record.id, 1, service_record.price, service_record.price);
      subtotal := subtotal + service_record.price;
    end loop;

    update public.treatments set total_amount = subtotal where id = v_treatment_id;

    insert into public.budgets (treatment_id, patient_id, status, subtotal_amount, discount_amount, total_amount, expires_at)
    values (v_treatment_id, r.id, (array['draft','sent','approved','rejected'])[1 + (idx % 4)], subtotal, case when idx % 5 = 0 then 50 else 0 end, subtotal - case when idx % 5 = 0 then 50 else 0 end, now() + interval '15 days')
    returning id into v_budget_id;

    insert into public.budget_items (budget_id, service_id, description, quantity, unit_price, total_price)
    select v_budget_id, ts.service_id, coalesce(s.name,'Servicio'), ts.quantity, ts.unit_price, ts.total_price
    from public.treatment_services ts left join public.services s on s.id = ts.service_id
    where ts.treatment_id = v_treatment_id;
  end loop;
end $$;

-- 40 pagos sobre presupuestos aprobados o enviados.
insert into public.payments (budget_id, patient_id, treatment_id, amount, method, status, paid_at, notes)
select b.id, b.patient_id, b.treatment_id, greatest(50, least(b.total_amount, b.total_amount * 0.5)), (array['cash','qr','transfer','card'])[1 + (row_number() over () % 4)], 'active', now() - ((row_number() over () % 30) || ' days')::interval, 'Pago QA'
from public.budgets b
where to_regclass('public.payments') is not null and b.status in ('sent','approved')
limit 40;

-- 20 egresos.
insert into public.expenses (category_id, expense_date, description, amount, payment_method, notes, status)
select c.id, current_date - (gs % 30), 'Egreso QA ' || gs, (50 + gs * 10)::numeric, (array['cash','qr','transfer','card'])[1 + (gs % 4)], 'Egreso generado para QA.', 'active'
from generate_series(1,20) gs
join lateral (select id from public.expense_categories order by name offset (gs % greatest((select count(*) from public.expense_categories),1)) limit 1) c on true
where to_regclass('public.expenses') is not null
on conflict do nothing;

-- 20 insumos base adicionales.
insert into public.inventory_items (name, category, unit, current_stock, minimum_stock, is_active, notes)
select 'Insumo QA ' || gs, (array['Bioseguridad','Clínico','Restauración','Ortodoncia'])[1 + (gs % 4)], 'unidad', (5 + gs)::numeric, 10::numeric, true, 'Insumo generado para QA.'
from generate_series(1,20) gs
where to_regclass('public.inventory_items') is not null
on conflict do nothing;

commit;
