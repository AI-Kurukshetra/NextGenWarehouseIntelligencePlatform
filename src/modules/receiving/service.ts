import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListReceivingInput = { limit: number; offset: number; q: string; vendor_id?: string; status?: string };
type CreateReceiptInput = { vendor_id?: string | null; warehouse_id?: string | null; client_id?: string | null; status: string; receipt_number?: string | null; expected_at?: string | null; received_at?: string | null };
type UpdateReceiptInput = Partial<CreateReceiptInput>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listReceipts(client: AppSupabaseClient, input: ListReceivingInput) {
  let query = client.from("receipts").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`receipt_number.ilike.%${input.q}%,status.ilike.%${input.q}%`);
  if (input.vendor_id) query = query.eq("vendor_id", input.vendor_id);
  if (input.status) query = query.eq("status", input.status);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch receipts.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createReceipt(client: AppSupabaseClient, input: CreateReceiptInput) {
  const { data, error } = await client.from("receipts").insert(input).select("*").single();
  throwIfError(error, "Failed to create receipt.");
  return data;
}

export async function getReceiptById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("receipts").select("*").eq("id", id).single();
  throwIfError(error, "Failed to fetch receipt.");
  return data;
}

export async function updateReceipt(client: AppSupabaseClient, id: string, input: UpdateReceiptInput) {
  const { data, error } = await client.from("receipts").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update receipt.");
  return data;
}

export async function confirmReceipt(client: AppSupabaseClient, receiptId: string) {
  const { data, error } = await client.from("receipts").update({ status: "received", received_at: new Date().toISOString() }).eq("id", receiptId).select("*").single();
  throwIfError(error, "Failed to confirm receipt.");
  return data;
}
