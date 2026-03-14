import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getErpIntegrations() {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("configurations")
    .select("*")
    .eq("scope", "integration:erp")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getCarrierIntegrations() {
  const client = createAdminSupabaseClient();
  const [{ data: carriers, error: carrierError }, { data: configs, error: configError }] = await Promise.all([
    client.from("carriers").select("*").order("name", { ascending: true }),
    client.from("configurations").select("*").eq("scope", "integration:carrier").order("updated_at", { ascending: false }),
  ]);

  if (carrierError) {
    throw new Error(carrierError.message);
  }

  if (configError) {
    throw new Error(configError.message);
  }

  return {
    carriers: carriers ?? [],
    configurations: configs ?? [],
  };
}
