import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";
import { writeAuditLogSafe } from "@/modules/core/audit";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type CreateWorkflowOrderInput = {
  client_id?: string | null;
  customer_id?: string | null;
  warehouse_id?: string | null;
  priority: string;
  order_number?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
};

type GeneratePickListInput = { order_id: string };
type AssignPickerInput = { picking_id: string; worker_id: string };
type PackShipmentInput = { order_id: string; carrier_id?: string | null; tracking_number?: string | null };
type ShipOrderInput = { shipment_id: string };

type ListWorkflowInput = { limit: number; offset: number; q: string; status?: string };

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

function normalizeOrder(order: any) {
  const picking = pickOne(order.pickings);
  const shipment = pickOne(order.shipments);

  return {
    ...order,
    customer: pickOne(order.customers),
    picking: picking
      ? {
          ...picking,
          worker: pickOne(picking.workers),
        }
      : null,
    shipment: shipment
      ? {
          ...shipment,
          carrier: pickOne(shipment.carriers),
        }
      : null,
    order_items: (order.order_items ?? []).map((item: any) => ({
      ...item,
      product: pickOne(item.products),
    })),
  };
}

export async function listFulfillmentOrders(client: AppSupabaseClient, input: ListWorkflowInput) {
  let query = client
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      priority,
      created_at,
      customer_id,
      customers ( id, name ),
      order_items ( id, quantity, picked_quantity, products ( id, name, sku, barcode ) ),
      pickings ( id, status, route_code, worker_id, started_at, completed_at, workers ( id, name, role ) ),
      shipments ( id, status, tracking_number, carrier_id, shipped_at, carriers ( id, name ) )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q) {
    query = query.or(`order_number.ilike.%${input.q}%,status.ilike.%${input.q}%`);
  }

  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch fulfillment orders.");

  return {
    rows: (data ?? []).map(normalizeOrder),
    count: count ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function createWorkflowOrder(client: AppSupabaseClient, input: CreateWorkflowOrderInput) {
  const orderNumber = input.order_number?.trim() || `SO-${Date.now()}`;
  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({
      client_id: input.client_id ?? null,
      customer_id: input.customer_id ?? null,
      warehouse_id: input.warehouse_id ?? null,
      status: "created",
      priority: input.priority,
      order_number: orderNumber,
      ordered_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  throwIfError(orderError, "Failed to create workflow order.");

  if (!order) {
    throw new ApiError(400, "Order creation returned no record.");
  }

  const { data: items, error: itemsError } = await client
    .from("order_items")
    .insert(
      input.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        picked_quantity: 0,
      })),
    )
    .select("*");

  if (itemsError) {
    await client.from("orders").delete().eq("id", order.id);
    throw new ApiError(400, "Failed to create workflow order items.", itemsError.message);
  }

  await writeAuditLogSafe(
    {
      action: "order.created",
      entity_type: "orders",
      entity_id: order.id,
      metadata: {
        order_number: order.order_number,
        priority: order.priority,
        status: order.status,
        item_count: input.items.length,
      },
    },
    { client },
  );

  return { order, items: items ?? [] };
}

export async function generatePickList(client: AppSupabaseClient, input: GeneratePickListInput) {
  const { data: order, error: orderError } = await client
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      order_items ( id, quantity, picked_quantity, products ( id, name, sku, barcode ) ),
      pickings ( id, status, route_code, worker_id )
    `)
    .eq("id", input.order_id)
    .single();
  throwIfError(orderError, "Failed to fetch order for pick-list generation.");

  if (!order) {
    throw new ApiError(404, "Order not found for pick-list generation.");
  }

  if (!order.order_items?.length) {
    throw new ApiError(400, "Order has no items to generate a pick list.");
  }

  const existingPicking = pickOne(order.pickings);
  const routeCode = existingPicking?.route_code ?? `PK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(order.order_number ?? input.order_id).slice(-6)}`;

  let picking = existingPicking;
  if (picking) {
    const { data, error } = await client
      .from("pickings")
      .update({ status: "ready", route_code: routeCode })
      .eq("id", picking.id)
      .select("*")
      .single();
    throwIfError(error, "Failed to update existing pick list.");
    picking = data;
  } else {
    const { data, error } = await client
      .from("pickings")
      .insert({
        order_id: input.order_id,
        status: "ready",
        route_code: routeCode,
      })
      .select("*")
      .single();
    throwIfError(error, "Failed to generate pick list.");
    picking = data;
  }

  const { data: updatedOrder, error: updateOrderError } = await client
    .from("orders")
    .update({ status: "pick_ready" })
    .eq("id", input.order_id)
    .select("*")
    .single();
  throwIfError(updateOrderError, "Failed to update order status for pick list.");

  await writeAuditLogSafe(
    {
      action: "picking.pick_list_generated",
      entity_type: "pickings",
      entity_id: picking?.id ?? null,
      metadata: {
        order_id: input.order_id,
        order_number: order.order_number ?? null,
        route_code: routeCode,
        item_count: order.order_items.length,
      },
    },
    { client },
  );

  return {
    order: updatedOrder,
    picking,
    pick_items: order.order_items.map((item: any) => {
      const product = pickOne(item.products);
      return {
        order_item_id: item.id,
        product_id: product?.id ?? null,
        product_name: product?.name ?? "Unknown product",
        sku: product?.sku ?? null,
        barcode: product?.barcode ?? null,
        quantity: item.quantity,
      };
    }),
  };
}

export async function assignPicker(client: AppSupabaseClient, input: AssignPickerInput) {
  const { data: worker, error: workerError } = await client.from("workers").select("id, name, role, status").eq("id", input.worker_id).single();
  throwIfError(workerError, "Failed to fetch worker for picker assignment.");

  if (!worker) {
    throw new ApiError(404, "Worker not found for picker assignment.");
  }

  if (worker.status !== "active") {
    throw new ApiError(400, "Only active workers can be assigned to a pick list.");
  }

  const { data: picking, error: pickingError } = await client
    .from("pickings")
    .update({ worker_id: input.worker_id, status: "assigned", started_at: new Date().toISOString() })
    .eq("id", input.picking_id)
    .select("*")
    .single();
  throwIfError(pickingError, "Failed to assign picker.");

  if (!picking) {
    throw new ApiError(404, "Picking record not found for assignment.");
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .update({ status: "picking_assigned" })
    .eq("id", picking.order_id)
    .select("*")
    .single();
  throwIfError(orderError, "Failed to update order after picker assignment.");

  await writeAuditLogSafe(
    {
      action: "picking.assigned",
      entity_type: "pickings",
      entity_id: input.picking_id,
      metadata: {
        order_id: picking.order_id,
        worker_id: worker.id,
        worker_name: worker.name,
        route_code: picking.route_code ?? null,
      },
    },
    { client },
  );

  return { picking, order, worker };
}

export async function confirmWorkflowPicking(client: AppSupabaseClient, pickingId: string) {
  const { data: picking, error: pickingError } = await client.from("pickings").select("*").eq("id", pickingId).single();
  throwIfError(pickingError, "Failed to fetch picking record.");

  if (!picking) {
    throw new ApiError(404, "Picking record not found.");
  }

  const { data: orderItems, error: orderItemsError } = await client
    .from("order_items")
    .select("id, quantity")
    .eq("order_id", picking.order_id);
  throwIfError(orderItemsError, "Failed to fetch order items for picking confirmation.");

  for (const item of orderItems ?? []) {
    const { error } = await client.from("order_items").update({ picked_quantity: item.quantity }).eq("id", item.id);
    throwIfError(error, "Failed to confirm picked quantities.");
  }

  const { data: updatedPicking, error: updatedPickingError } = await client
    .from("pickings")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", pickingId)
    .select("*")
    .single();
  throwIfError(updatedPickingError, "Failed to confirm picking.");

  const { data: order, error: orderError } = await client
    .from("orders")
    .update({ status: "picked" })
    .eq("id", picking.order_id)
    .select("*")
    .single();
  throwIfError(orderError, "Failed to update order after picking confirmation.");

  await writeAuditLogSafe(
    {
      action: "picking.confirmed",
      entity_type: "pickings",
      entity_id: pickingId,
      metadata: {
        order_id: picking.order_id,
        item_count: orderItems?.length ?? 0,
        status: "completed",
      },
    },
    { client },
  );

  return { picking: updatedPicking, order };
}

export async function packShipment(client: AppSupabaseClient, input: PackShipmentInput) {
  const { data: order, error: orderError } = await client.from("orders").select("*").eq("id", input.order_id).single();
  throwIfError(orderError, "Failed to fetch order for packing.");

  if (!order) {
    throw new ApiError(404, "Order not found for packing.");
  }

  if (!["picked", "packed"].includes(order.status)) {
    throw new ApiError(400, "Order must be picked before packing can start.");
  }

  const { data: existingShipment, error: existingShipmentError } = await client
    .from("shipments")
    .select("*")
    .eq("order_id", input.order_id)
    .maybeSingle();
  throwIfError(existingShipmentError, "Failed to inspect shipment before packing.");

  let shipment = existingShipment;
  if (shipment) {
    const { data, error } = await client
      .from("shipments")
      .update({
        carrier_id: input.carrier_id ?? shipment.carrier_id ?? null,
        tracking_number: input.tracking_number ?? shipment.tracking_number ?? null,
        status: "packed",
      })
      .eq("id", shipment.id)
      .select("*")
      .single();
    throwIfError(error, "Failed to update shipment during packing.");
    shipment = data;
  } else {
    const { data, error } = await client
      .from("shipments")
      .insert({
        order_id: input.order_id,
        carrier_id: input.carrier_id ?? null,
        tracking_number: input.tracking_number ?? null,
        status: "packed",
      })
      .select("*")
      .single();
    throwIfError(error, "Failed to create shipment during packing.");
    shipment = data;
  }

  const { data: updatedOrder, error: updatedOrderError } = await client
    .from("orders")
    .update({ status: "packed" })
    .eq("id", input.order_id)
    .select("*")
    .single();
  throwIfError(updatedOrderError, "Failed to update order after packing.");

  await writeAuditLogSafe(
    {
      action: "shipment.packed",
      entity_type: "shipments",
      entity_id: shipment?.id ?? null,
      metadata: {
        order_id: input.order_id,
        carrier_id: shipment?.carrier_id ?? null,
        tracking_number: shipment?.tracking_number ?? null,
        status: shipment?.status ?? "packed",
      },
    },
    { client },
  );

  return { shipment, order: updatedOrder };
}

export async function shipOrder(client: AppSupabaseClient, input: ShipOrderInput) {
  const { data: shipment, error: shipmentError } = await client.from("shipments").select("*").eq("id", input.shipment_id).single();
  throwIfError(shipmentError, "Failed to fetch shipment for shipping.");

  if (!shipment) {
    throw new ApiError(404, "Shipment not found for shipping.");
  }

  if (shipment.status !== "packed") {
    throw new ApiError(400, "Shipment must be packed before it can be shipped.");
  }

  const shippedAt = new Date().toISOString();
  const { data: updatedShipment, error: updatedShipmentError } = await client
    .from("shipments")
    .update({ status: "shipped", shipped_at: shippedAt })
    .eq("id", input.shipment_id)
    .select("*")
    .single();
  throwIfError(updatedShipmentError, "Failed to ship order.");

  const { data: order, error: orderError } = await client
    .from("orders")
    .update({ status: "shipped" })
    .eq("id", shipment.order_id)
    .select("*")
    .single();
  throwIfError(orderError, "Failed to update order after shipping.");

  await writeAuditLogSafe(
    {
      action: "shipment.shipped",
      entity_type: "shipments",
      entity_id: input.shipment_id,
      metadata: {
        order_id: shipment.order_id,
        tracking_number: updatedShipment?.tracking_number ?? null,
        shipped_at: shippedAt,
        status: "shipped",
      },
    },
    { client },
  );

  return { shipment: updatedShipment, order };
}

export async function getFulfillmentPageData(client: AppSupabaseClient) {
  const [ordersResult, workersResult, productsResult] = await Promise.all([
    listFulfillmentOrders(client, { limit: 20, offset: 0, q: "" }),
    client.from("workers").select("id, name, role, status").eq("status", "active").order("name", { ascending: true }),
    client.from("products").select("id, name, sku, barcode").order("name", { ascending: true }).limit(100),
  ]);

  throwIfError(workersResult.error, "Failed to fetch worker options.");
  throwIfError(productsResult.error, "Failed to fetch product options.");

  const orders = ordersResult.rows;
  const summary = {
    created: orders.filter((order) => ["created", "pick_ready", "picking_assigned"].includes(order.status)).length,
    picked: orders.filter((order) => order.status === "picked").length,
    packed: orders.filter((order) => order.status === "packed").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
  };

  return {
    summary,
    orders,
    workers: workersResult.data ?? [],
    products: productsResult.data ?? [],
  };
}
