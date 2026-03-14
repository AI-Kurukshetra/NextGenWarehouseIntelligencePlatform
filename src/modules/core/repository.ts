import type { PostgrestError } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ManagedTable } from "@/modules/core/tables";

type Pagination = {
  limit: number;
  offset: number;
  query?: string;
  searchColumn?: string;
};

type UpsertOptions = {
  onConflict?: string;
};

function throwIfError(error: PostgrestError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function listRecords(table: ManagedTable, pagination: Pagination) {
  const client = createAdminSupabaseClient();
  let query = client
    .from(table)
    .select("*", { count: "exact" })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .order("created_at", { ascending: false });

  if (pagination.query && pagination.searchColumn) {
    query = query.ilike(pagination.searchColumn, `%${pagination.query}%`);
  }

  const { data, count, error } = await query;
  throwIfError(error);

  return {
    rows: data ?? [],
    count: count ?? 0,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

export async function getRecordById(table: ManagedTable, id: string) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from(table).select("*").eq("id", id).single();
  throwIfError(error);
  return data;
}

export async function createRecord<T extends Record<string, unknown>>(table: ManagedTable, payload: T) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from(table).insert(payload).select("*").single();
  throwIfError(error);
  return data;
}

export async function updateRecord<T extends Record<string, unknown>>(
  table: ManagedTable,
  id: string,
  payload: T,
) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from(table).update(payload).eq("id", id).select("*").single();
  throwIfError(error);
  return data;
}

export async function deleteRecord(table: ManagedTable, id: string) {
  const client = createAdminSupabaseClient();
  const { error } = await client.from(table).delete().eq("id", id);
  throwIfError(error);
  return { id };
}

export async function upsertRecord<T extends Record<string, unknown>>(
  table: ManagedTable,
  payload: T,
  options?: UpsertOptions,
) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from(table)
    .upsert(payload, {
      onConflict: options?.onConflict,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data;
}
