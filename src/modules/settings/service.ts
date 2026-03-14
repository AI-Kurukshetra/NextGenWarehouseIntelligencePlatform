import { parsePagination } from "@/lib/api/route-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { upsertRecord } from "@/modules/core/repository";
import { writeAuditLog } from "@/modules/core/audit";

export async function getSettingsSummary() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("configurations")
    .select("key, scope, is_secret, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return {
    totalConfigurations: data?.length ?? 0,
    recent: data ?? [],
  };
}

export async function listConfigurations(request: Request) {
  const client = createAdminSupabaseClient();
  const pagination = parsePagination(request);
  const { data, count, error } = await client
    .from("configurations")
    .select("*", { count: "exact" })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: data ?? [],
    count: count ?? 0,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

type UpsertConfigurationPayload = {
  key: string;
  value: unknown;
  scope?: string;
  description?: string;
  is_secret?: boolean;
};

export async function saveConfiguration(payload: UpsertConfigurationPayload) {
  const scope = payload.scope ?? "system";
  const row = await upsertRecord(
    "configurations",
    {
      key: payload.key,
      value: payload.value ?? {},
      scope,
      description: payload.description ?? null,
      is_secret: payload.is_secret ?? false,
    },
    {
      onConflict: "key,scope",
    },
  );

  await writeAuditLog({
    action: "settings.configuration.saved",
    entity_type: "configurations",
    entity_id: String(row.id),
    metadata: {
      key: payload.key,
      scope,
    },
  });

  return row;
}
