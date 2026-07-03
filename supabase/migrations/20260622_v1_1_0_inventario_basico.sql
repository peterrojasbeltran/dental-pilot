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
