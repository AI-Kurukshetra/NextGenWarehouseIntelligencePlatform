create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  location text not null,
  timezone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  contact text,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null default 'worker',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  code text unique,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  service_level text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  sku text not null unique,
  barcode text unique,
  description text,
  unit_of_measure text not null default 'each',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  name text,
  code text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (warehouse_id, code)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  zone_id uuid references public.zones (id) on delete set null,
  code text not null,
  bin text,
  capacity integer,
  location_type text not null default 'storage',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (warehouse_id, code)
);

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  lot_number text,
  serial_number text,
  expiration_date date,
  manufactured_at date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  product_id uuid not null references public.products (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  lot_id uuid references public.lots (id) on delete set null,
  quantity numeric(14,2) not null default 0,
  reserved_quantity numeric(14,2) not null default 0,
  available_quantity numeric(14,2) generated always as (quantity - reserved_quantity) stored,
  status text not null default 'available',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete set null,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  status text not null default 'draft',
  receipt_number text unique,
  expected_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  status text not null default 'draft',
  priority text not null default 'normal',
  order_number text unique,
  ordered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(14,2) not null,
  picked_quantity numeric(14,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier_id uuid references public.carriers (id) on delete set null,
  tracking_number text unique,
  status text not null default 'pending',
  shipped_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  name text not null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pickings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  worker_id uuid references public.workers (id) on delete set null,
  status text not null default 'pending',
  route_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  assigned_worker uuid references public.workers (id) on delete set null,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'queued',
  priority text not null default 'normal',
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cycle_counts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  status text not null default 'scheduled',
  scheduled_for timestamptz,
  counted_at timestamptz,
  variance numeric(14,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory (id) on delete cascade,
  quantity_delta numeric(14,2) not null,
  reason text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  status text not null default 'received',
  disposition text,
  received_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  billing_type text not null,
  amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending',
  reference text,
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  metric_type text not null,
  metric_value numeric(14,2) not null default 0,
  dimension text,
  warehouse_id uuid references public.warehouses (id) on delete set null,
  captured_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  performed_by uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exceptions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  scope text not null default 'system',
  description text,
  is_secret boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (key, scope)
);

create index if not exists idx_inventory_product on public.inventory (product_id);
create index if not exists idx_inventory_location on public.inventory (location_id);
create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_tasks_assigned_worker on public.tasks (assigned_worker);
create index if not exists idx_pickings_order on public.pickings (order_id);
create index if not exists idx_shipments_order on public.shipments (order_id);
create index if not exists idx_billing_client on public.billing (client_id);
create index if not exists idx_metrics_type on public.metrics (metric_type);
create index if not exists idx_exceptions_status on public.exceptions (status);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'worker')
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

alter table public.users enable row level security;
create policy "users_select_own_profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users_update_own_profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.attach_updated_at_trigger(target_table regclass)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists set_updated_at on %s;', target_table);
  execute format(
    'create trigger set_updated_at before update on %s for each row execute function public.set_updated_at();',
    target_table
  );
end;
$$;

select public.attach_updated_at_trigger('public.warehouses');
select public.attach_updated_at_trigger('public.clients');
select public.attach_updated_at_trigger('public.users');
select public.attach_updated_at_trigger('public.vendors');
select public.attach_updated_at_trigger('public.customers');
select public.attach_updated_at_trigger('public.carriers');
select public.attach_updated_at_trigger('public.products');
select public.attach_updated_at_trigger('public.zones');
select public.attach_updated_at_trigger('public.locations');
select public.attach_updated_at_trigger('public.lots');
select public.attach_updated_at_trigger('public.inventory');
select public.attach_updated_at_trigger('public.receipts');
select public.attach_updated_at_trigger('public.orders');
select public.attach_updated_at_trigger('public.order_items');
select public.attach_updated_at_trigger('public.shipments');
select public.attach_updated_at_trigger('public.workers');
select public.attach_updated_at_trigger('public.pickings');
select public.attach_updated_at_trigger('public.tasks');
select public.attach_updated_at_trigger('public.cycle_counts');
select public.attach_updated_at_trigger('public.adjustments');
select public.attach_updated_at_trigger('public.returns');
select public.attach_updated_at_trigger('public.kits');
select public.attach_updated_at_trigger('public.billing');
select public.attach_updated_at_trigger('public.metrics');
select public.attach_updated_at_trigger('public.audits');
select public.attach_updated_at_trigger('public.exceptions');
select public.attach_updated_at_trigger('public.configurations');
