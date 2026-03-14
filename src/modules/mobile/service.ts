import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getMobileTasks() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .in("status", ["queued", "assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMobilePicking() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("pickings")
    .select("*")
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMobileReceiving() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("receipts")
    .select("*")
    .in("status", ["draft", "received"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
