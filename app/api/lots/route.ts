import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createLotSchema, listLotsQuerySchema } from "@/modules/lots/schemas";
import { createLot, listLots } from "@/modules/lots/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listLotsQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listLots(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createLotSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createLot(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
