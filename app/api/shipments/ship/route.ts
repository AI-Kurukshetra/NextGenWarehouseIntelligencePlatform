import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shipOrderSchema } from "@/modules/fulfillment/schemas";
import { shipOrder } from "@/modules/fulfillment/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, shipOrderSchema);
  const supabase = await createServerSupabaseClient();
  const data = await shipOrder(supabase, payload);
  return jsonSuccess(data);
});
