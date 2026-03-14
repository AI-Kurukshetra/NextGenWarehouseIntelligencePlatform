import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { confirmPickingSchema } from "@/modules/picking/schemas";
import { confirmWorkflowPicking } from "@/modules/fulfillment/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, confirmPickingSchema);
  const supabase = await createServerSupabaseClient();
  const data = await confirmWorkflowPicking(supabase, payload.picking_id);
  return jsonSuccess(data);
});
