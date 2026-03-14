import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getInventoryReport() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("inventory").select("quantity, location_id, product_id, status");

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return {
    totalLines: rows.length,
    totalQuantity: rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    distinctLocations: new Set(rows.map((row) => row.location_id)).size,
    distinctProducts: new Set(rows.map((row) => row.product_id)).size,
    blockedLines: rows.filter((row) => row.status === "blocked").length,
  };
}

export async function getOrdersReport() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("orders").select("status, priority");

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return {
    totalOrders: rows.length,
    byStatus: rows.reduce<Record<string, number>>((accumulator, row) => {
      const key = row.status ?? "unknown";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {}),
    highPriorityOrders: rows.filter((row) => row.priority === "high").length,
  };
}

export async function getWorkersReport() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("workers").select("role, status");

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return {
    totalWorkers: rows.length,
    activeWorkers: rows.filter((row) => row.status === "active").length,
    byRole: rows.reduce<Record<string, number>>((accumulator, row) => {
      const key = row.role ?? "unknown";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}
