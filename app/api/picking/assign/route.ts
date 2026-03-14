import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assignPickerSchema } from "@/modules/fulfillment/schemas";
import { assignPicker } from "@/modules/fulfillment/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, assignPickerSchema);
  const supabase = await createServerSupabaseClient();
  const data = await assignPicker(supabase, payload);
  return jsonSuccess(data);
});
