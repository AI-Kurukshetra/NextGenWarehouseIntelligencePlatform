import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { transferInventorySchema } from "@/modules/inventory/schemas";
import { transferInventory } from "@/modules/inventory/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, transferInventorySchema);
  const supabase = await createServerSupabaseClient();
  const data = await transferInventory(supabase, payload);
  return jsonSuccess(data);
});
