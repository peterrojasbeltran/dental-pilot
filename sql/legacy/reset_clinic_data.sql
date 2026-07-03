-- Dental Pilot v1.3.2
-- Reinicio de datos operativos de la clínica.
-- NO afecta demo pública, usuarios/auth, configuración ni catálogos base.

begin;

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

commit;
