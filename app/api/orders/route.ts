import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createWorkflowOrderSchema, fulfillmentQuerySchema } from "@/modules/fulfillment/schemas";
import { createWorkflowOrder, listFulfillmentOrders } from "@/modules/fulfillment/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, fulfillmentQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listFulfillmentOrders(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createWorkflowOrderSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createWorkflowOrder(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
