create table if not exists public.slotting_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  current_location_id uuid not null constraint slotting_recommendations_current_location_id_fkey references public.locations (id) on delete cascade,
  recommended_location_id uuid not null constraint slotting_recommendations_recommended_location_id_fkey references public.locations (id) on delete cascade,
  optimization_score numeric(12, 4) not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_slotting_recommendations_product_id on public.slotting_recommendations (product_id);
create index if not exists idx_slotting_recommendations_current_location_id on public.slotting_recommendations (current_location_id);
create index if not exists idx_slotting_recommendations_recommended_location_id on public.slotting_recommendations (recommended_location_id);
create index if not exists idx_slotting_recommendations_score on public.slotting_recommendations (optimization_score desc);

alter table public.slotting_recommendations enable row level security;

drop policy if exists authenticated_all_slotting_recommendations on public.slotting_recommendations;
create policy authenticated_all_slotting_recommendations on public.slotting_recommendations
  for all
  to authenticated
  using (true)
  with check (true);
