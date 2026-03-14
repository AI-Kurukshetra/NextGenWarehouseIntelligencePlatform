import type { SupabaseClient } from "@supabase/supabase-js";

import { generateSlottingRecommendations } from "@/lib/optimization/slotting";

const quickLinks = [
  { href: "/inventory", title: "Inventory", description: "Inspect stock balances and location-level availability." },
  { href: "/orders", title: "Orders", description: "Track outbound execution from order creation to shipment." },
  { href: "/receiving", title: "Receiving", description: "Confirm inbound receipts and dock activity." },
  { href: "/shipping", title: "Shipping", description: "Monitor packing progress and outbound carrier readiness." },
  { href: "/optimization", title: "Optimization", description: "Review AI slotting opportunities and apply relocations." },
];

type AppSupabaseClient = SupabaseClient<any, "public", any>;

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getDashboardPageData(client: AppSupabaseClient) {
  const [inventoryResult, orderResult, shipmentResult, workerResult, adjustmentResult, receiptResult, optimizationResult] = await Promise.all([
    client.from("inventory").select("id, quantity, reserved_quantity, status, products ( name, sku ), locations ( code )").order("updated_at", { ascending: false }).limit(8),
    client.from("orders").select("id, order_number, status, priority, created_at, customers ( name )", { count: "exact" }).order("created_at", { ascending: false }).limit(8),
    client.from("shipments").select("id, status, tracking_number, shipped_at, carriers ( name )", { count: "exact" }).order("created_at", { ascending: false }).limit(8),
    client.from("workers").select("id, name, role, status, warehouse_id").order("updated_at", { ascending: false }).limit(6),
    client.from("adjustments").select("id, quantity_delta, reason, created_at, inventory ( products ( name, sku ), locations ( code ) )").order("created_at", { ascending: false }).limit(5),
    client.from("receipts").select("id, receipt_number, status, received_at, created_at").order("created_at", { ascending: false }).limit(5),
    generateSlottingRecommendations(client, { limit: 5, persist: false }),
  ]);

  const inventoryRows = inventoryResult.data ?? [];
  const orders = orderResult.data ?? [];
  const shipments = shipmentResult.data ?? [];
  const workers = workerResult.data ?? [];
  const adjustments = adjustmentResult.data ?? [];
  const receipts = receiptResult.data ?? [];
  const optimizationRecommendations = optimizationResult ?? [];

  const inventorySummary = {
    onHand: inventoryRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    reserved: inventoryRows.reduce((sum, row) => sum + Number(row.reserved_quantity ?? 0), 0),
    lowStock: inventoryRows.filter((row) => Number(row.quantity ?? 0) <= 10).length,
    activeLines: inventoryRows.filter((row) => row.status === "available").length,
  };

  const orderSummary = {
    active: orders.filter((row) => row.status !== "shipped").length,
    pickReady: orders.filter((row) => ["pick_ready", "picking_assigned"].includes(row.status)).length,
    packed: orders.filter((row) => row.status === "packed").length,
    shipped: orders.filter((row) => row.status === "shipped").length,
    total: orderResult.count ?? orders.length,
  };

  const shipmentSummary = {
    pending: shipments.filter((row) => ["pending", "packed"].includes(row.status)).length,
    shippedToday: shipments.filter((row) => Boolean(row.shipped_at)).length,
    exception: shipments.filter((row) => row.status === "exception").length,
    total: shipmentResult.count ?? shipments.length,
  };

  const recentOperations = [
    ...adjustments.map((row) => ({
      id: `adjustment-${row.id}`,
      type: "Adjustment",
      description: `${pickOne(pickOne(row.inventory)?.products)?.sku ?? pickOne(pickOne(row.inventory)?.products)?.name ?? "Inventory"} at ${pickOne(pickOne(row.inventory)?.locations)?.code ?? "Unknown location"}`,
      outcome: `${Number(row.quantity_delta) >= 0 ? "+" : ""}${row.quantity_delta} units`,
      timestamp: row.created_at,
    })),
    ...receipts.map((row) => ({
      id: `receipt-${row.id}`,
      type: "Receipt",
      description: row.receipt_number ?? "Inbound receipt",
      outcome: row.status,
      timestamp: row.received_at ?? row.created_at,
    })),
    ...shipments.map((row) => ({
      id: `shipment-${row.id}`,
      type: "Shipment",
      description: row.tracking_number ?? pickOne(row.carriers)?.name ?? "Carrier pending",
      outcome: row.status,
      timestamp: row.shipped_at ?? null,
    })),
  ]
    .filter((row) => row.timestamp)
    .sort((a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime())
    .slice(0, 6);

  return {
    inventorySummary,
    orderSummary,
    shipmentSummary,
    workers,
    orders,
    shipments,
    recentOperations,
    quickLinks,
    optimizationSummary: {
      opportunities: optimizationRecommendations.length,
      topRecommendation: optimizationRecommendations[0] ?? null,
    },
  };
}
