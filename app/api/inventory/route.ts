import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createInventorySchema, listInventoryQuerySchema } from "@/modules/inventory/schemas";
import { createInventoryLine, listInventory } from "@/modules/inventory/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listInventoryQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listInventory(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createInventorySchema);
  const supabase = await createServerSupabaseClient();
  const data = await createInventoryLine(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
