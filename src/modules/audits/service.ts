import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListAuditLogsInput = {
  limit: number;
  offset: number;
  q?: string;
  action?: string;
  entity_type?: string;
  performed_by?: string;
};

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    throw new ApiError(400, fallbackMessage, error.message);
  }
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeAudit(row: any) {
  return {
    ...row,
    users: pickOne(row.users),
  };
}

export async function listAuditLogs(client: AppSupabaseClient, input: ListAuditLogsInput) {
  let query = client
    .from("audits")
    .select("id, action, entity_type, entity_id, performed_by, metadata, created_at, users ( id, name, email, role )", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.action) {
    query = query.eq("action", input.action);
  }

  if (input.entity_type) {
    query = query.eq("entity_type", input.entity_type);
  }

  if (input.performed_by) {
    query = query.eq("performed_by", input.performed_by);
  }

  if (input.q) {
    query = query.or(`action.ilike.%${input.q}%,entity_type.ilike.%${input.q}%`);
  }

  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch audit logs.");

  const rows = (data ?? []).map(normalizeAudit).filter((row) => {
    if (!input.q) {
      return true;
    }

    const needle = input.q.toLowerCase();
    return [
      row.action,
      row.entity_type,
      row.entity_id,
      row.users?.name,
      row.users?.email,
      row.users?.role,
      JSON.stringify(row.metadata ?? {}),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  return {
    rows,
    count: input.q ? rows.length : count ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function getAuditPageData(client: AppSupabaseClient) {
  const result = await listAuditLogs(client, { limit: 50, offset: 0, q: "" });
  const rows = result.rows;
  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

  return {
    rows,
    summary: {
      total: rows.length,
      actors: new Set(rows.map((row) => row.performed_by).filter(Boolean)).size,
      entityTypes: new Set(rows.map((row) => row.entity_type).filter(Boolean)).size,
      last24Hours: rows.filter((row) => new Date(String(row.created_at)).getTime() >= last24Hours).length,
    },
  };
}
