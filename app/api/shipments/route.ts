import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createShipmentSchema, listShipmentsQuerySchema } from "@/modules/shipments/schemas";
import { createShipment, listShipments } from "@/modules/shipments/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listShipmentsQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listShipments(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createShipmentSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createShipment(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
