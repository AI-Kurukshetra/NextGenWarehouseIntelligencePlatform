import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";
import { writeAuditLogSafe } from "@/modules/core/audit";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListOrdersInput = { limit: number; offset: number; q: string; customer_id?: string; status?: string };
type CreateOrderInput = { client_id?: string | null; customer_id?: string | null; warehouse_id?: string | null; status: string; priority: string; order_number?: string | null; ordered_at?: string | null; items: Array<{ product_id: string; quantity: number }> };
type UpdateOrderInput = Partial<Omit<CreateOrderInput, "items">>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listOrders(client: AppSupabaseClient, input: ListOrdersInput) {
  let query = client.from("orders").select("*, order_items(*)", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`order_number.ilike.%${input.q}%,status.ilike.%${input.q}%`);
  if (input.customer_id) query = query.eq("customer_id", input.customer_id);
  if (input.status) query = query.eq("status", input.status);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch orders.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createOrder(client: AppSupabaseClient, input: CreateOrderInput) {
  const { data: order, error: orderError } = await client.from("orders").insert({ client_id: input.client_id ?? null, customer_id: input.customer_id ?? null, warehouse_id: input.warehouse_id ?? null, status: input.status, priority: input.priority, order_number: input.order_number ?? null, ordered_at: input.ordered_at ?? null }).select("*").single();
  throwIfError(orderError, "Failed to create order.");
  let items: unknown[] = [];
  if (input.items.length > 0) {
    const { data, error } = await client.from("order_items").insert(input.items.map((item) => ({ order_id: order.id, product_id: item.product_id, quantity: item.quantity }))).select("*");
    if (error) {
      await client.from("orders").delete().eq("id", order.id);
      throw new ApiError(400, "Failed to create order items.", error.message);
    }
    items = data ?? [];
  }

  await writeAuditLogSafe(
    {
      action: "order.created",
      entity_type: "orders",
      entity_id: order.id,
      metadata: {
        order_number: order.order_number,
        status: order.status,
        priority: order.priority,
        item_count: input.items.length,
      },
    },
    { client },
  );

  return { order, items };
}

export async function getOrderById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("orders").select("*, order_items(*)").eq("id", id).single();
  throwIfError(error, "Failed to fetch order.");
  return data;
}

export async function updateOrder(client: AppSupabaseClient, id: string, input: UpdateOrderInput) {
  const { data, error } = await client.from("orders").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update order.");

  await writeAuditLogSafe(
    {
      action: "order.updated",
      entity_type: "orders",
      entity_id: id,
      metadata: input,
    },
    { client },
  );

  return data;
}

export async function deleteOrder(client: AppSupabaseClient, id: string) {
  const { error } = await client.from("orders").delete().eq("id", id);
  throwIfError(error, "Failed to delete order.");

  await writeAuditLogSafe(
    {
      action: "order.deleted",
      entity_type: "orders",
      entity_id: id,
    },
    { client },
  );

  return { id };
}
