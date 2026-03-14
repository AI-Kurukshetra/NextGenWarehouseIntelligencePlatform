import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getDashboardSummary() {
  const client = createAdminSupabaseClient();
  const [orders, inventory, exceptions, workers] = await Promise.all([
    client.from("orders").select("status", { count: "exact", head: true }).eq("status", "pending"),
    client.from("inventory").select("quantity"),
    client.from("exceptions").select("id", { count: "exact", head: true }).eq("status", "open"),
    client.from("workers").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  if (orders.error) {
    throw new Error(orders.error.message);
  }

  if (inventory.error) {
    throw new Error(inventory.error.message);
  }

  if (exceptions.error) {
    throw new Error(exceptions.error.message);
  }

  if (workers.error) {
    throw new Error(workers.error.message);
  }

  return {
    pendingOrders: orders.count ?? 0,
    openExceptions: exceptions.count ?? 0,
    activeWorkers: workers.count ?? 0,
    totalInventoryQuantity: (inventory.data ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
  };
}

export async function getMetricsFeed() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("metrics").select("*").order("captured_at", { ascending: false }).limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
