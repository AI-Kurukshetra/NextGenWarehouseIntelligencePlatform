import { handleRoute, jsonSuccess, parseJsonBody, parseParams } from "@/lib/api/route";
import { idParamsSchema } from "@/lib/api/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateLotSchema } from "@/modules/lots/schemas";
import { getLotById, updateLot } from "@/modules/lots/service";

export const GET = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await getLotById(supabase, id);
  return jsonSuccess(data);
});

export const PATCH = handleRoute(async (request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const payload = await parseJsonBody(request, updateLotSchema);
  const supabase = await createServerSupabaseClient();
  const data = await updateLot(supabase, id, payload);
  return jsonSuccess(data);
});
