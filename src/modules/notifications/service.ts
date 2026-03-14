import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getNotificationsFeed() {
  const client = createAdminSupabaseClient();
  const [{ data: exceptions, error: exceptionsError }, { data: audits, error: auditsError }] = await Promise.all([
    client.from("exceptions").select("id, description, severity, status, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(25),
    client.from("audits").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(25),
  ]);

  if (exceptionsError) {
    throw new Error(exceptionsError.message);
  }

  if (auditsError) {
    throw new Error(auditsError.message);
  }

  return {
    exceptions: exceptions ?? [],
    audits: audits ?? [],
  };
}
