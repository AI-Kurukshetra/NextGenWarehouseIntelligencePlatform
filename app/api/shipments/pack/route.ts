import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { packShipmentSchema } from "@/modules/fulfillment/schemas";
import { packShipment } from "@/modules/fulfillment/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, packShipmentSchema);
  const supabase = await createServerSupabaseClient();
  const data = await packShipment(supabase, payload);
  return jsonSuccess(data);
});
