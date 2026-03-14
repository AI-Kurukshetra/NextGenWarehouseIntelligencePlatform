import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPickingSchema, listPickingQuerySchema } from "@/modules/picking/schemas";
import { createPicking, listPickings } from "@/modules/picking/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listPickingQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listPickings(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createPickingSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createPicking(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
