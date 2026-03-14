import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListShipmentsInput = { limit: number; offset: number; q: string; order_id?: string; carrier_id?: string };
type CreateShipmentInput = { order_id: string; carrier_id?: string | null; tracking_number?: string | null; status: string; shipped_at?: string | null };
type UpdateShipmentInput = Partial<CreateShipmentInput>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listShipments(client: AppSupabaseClient, input: ListShipmentsInput) {
  let query = client.from("shipments").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`tracking_number.ilike.%${input.q}%,status.ilike.%${input.q}%`);
  if (input.order_id) query = query.eq("order_id", input.order_id);
  if (input.carrier_id) query = query.eq("carrier_id", input.carrier_id);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch shipments.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createShipment(client: AppSupabaseClient, input: CreateShipmentInput) {
  const { data, error } = await client.from("shipments").insert(input).select("*").single();
  throwIfError(error, "Failed to create shipment.");
  return data;
}

export async function getShipmentById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("shipments").select("*").eq("id", id).single();
  throwIfError(error, "Failed to fetch shipment.");
  return data;
}

export async function updateShipment(client: AppSupabaseClient, id: string, input: UpdateShipmentInput) {
  const { data, error } = await client.from("shipments").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update shipment.");
  return data;
}

export async function deleteShipment(client: AppSupabaseClient, id: string) {
  const { error } = await client.from("shipments").delete().eq("id", id);
  throwIfError(error, "Failed to delete shipment.");
  return { id };
}
