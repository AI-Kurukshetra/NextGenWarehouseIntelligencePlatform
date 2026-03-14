import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adjustInventorySchema } from "@/modules/inventory/schemas";
import { adjustInventory } from "@/modules/inventory/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, adjustInventorySchema);
  const supabase = await createServerSupabaseClient();
  const data = await adjustInventory(supabase, payload);
  return jsonSuccess(data);
});
