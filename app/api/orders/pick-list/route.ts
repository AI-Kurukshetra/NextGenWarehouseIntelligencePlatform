import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePickListSchema } from "@/modules/fulfillment/schemas";
import { generatePickList } from "@/modules/fulfillment/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, generatePickListSchema);
  const supabase = await createServerSupabaseClient();
  const data = await generatePickList(supabase, payload);
  return jsonSuccess(data);
});
