import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createLocationSchema, listLocationsQuerySchema } from "@/modules/locations/schemas";
import { createLocation, listLocations } from "@/modules/locations/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listLocationsQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listLocations(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createLocationSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createLocation(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
