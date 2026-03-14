-- Local development authenticated access policies for MVP workflows.
do $$
declare
  table_name text;
  all_access_tables text[] := array[
    'warehouses',
    'clients',
    'users',
    'vendors',
    'customers',
    'carriers',
    'products',
    'zones',
    'locations',
    'lots',
    'inventory',
    'receipts',
    'orders',
    'order_items',
    'shipments',
    'workers',
    'pickings',
    'tasks',
    'cycle_counts',
    'adjustments',
    'returns',
    'kits',
    'billing',
    'metrics',
    'audits',
    'exceptions',
    'configurations'
  ];
begin
  foreach table_name in array all_access_tables loop
    execute format('drop policy if exists authenticated_all_%I on public.%I;', table_name, table_name);
    execute format(
      'create policy authenticated_all_%I on public.%I for all to authenticated using (true) with check (true);',
      table_name,
      table_name
    );
  end loop;
end;
$$;

