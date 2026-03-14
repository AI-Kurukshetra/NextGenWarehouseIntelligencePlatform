import { handleRoute, jsonSuccess, parseJsonBody, parseParams } from "@/lib/api/route";
import { idParamsSchema } from "@/lib/api/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateLocationSchema } from "@/modules/locations/schemas";
import { getLocationById, updateLocation } from "@/modules/locations/service";

export const GET = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await getLocationById(supabase, id);
  return jsonSuccess(data);
});

export const PATCH = handleRoute(async (request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const payload = await parseJsonBody(request, updateLocationSchema);
  const supabase = await createServerSupabaseClient();
  const data = await updateLocation(supabase, id, payload);
  return jsonSuccess(data);
});
