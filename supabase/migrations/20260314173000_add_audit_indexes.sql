create index if not exists idx_audits_action on public.audits (action);
create index if not exists idx_audits_entity_type on public.audits (entity_type);
create index if not exists idx_audits_entity_id on public.audits (entity_id);
create index if not exists idx_audits_created_at on public.audits (created_at desc);
