import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListPickingInput = { limit: number; offset: number; q: string; order_id?: string; worker_id?: string; status?: string };
type CreatePickingInput = { order_id: string; worker_id?: string | null; status: string; route_code?: string | null; started_at?: string | null; completed_at?: string | null };

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listPickings(client: AppSupabaseClient, input: ListPickingInput) {
  let query = client.from("pickings").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`route_code.ilike.%${input.q}%,status.ilike.%${input.q}%`);
  if (input.order_id) query = query.eq("order_id", input.order_id);
  if (input.worker_id) query = query.eq("worker_id", input.worker_id);
  if (input.status) query = query.eq("status", input.status);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch pickings.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createPicking(client: AppSupabaseClient, input: CreatePickingInput) {
  const { data, error } = await client.from("pickings").insert({ ...input, started_at: input.started_at ?? new Date().toISOString() }).select("*").single();
  throwIfError(error, "Failed to create picking record.");
  return data;
}

export async function confirmPicking(client: AppSupabaseClient, pickingId: string) {
  const { data, error } = await client.from("pickings").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", pickingId).select("*").single();
  throwIfError(error, "Failed to confirm picking.");
  return data;
}
