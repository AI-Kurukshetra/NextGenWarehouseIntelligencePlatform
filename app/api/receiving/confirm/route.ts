import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { confirmReceiptSchema } from "@/modules/receiving/schemas";
import { confirmReceipt } from "@/modules/receiving/service";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, confirmReceiptSchema);
  const supabase = await createServerSupabaseClient();
  const data = await confirmReceipt(supabase, payload.receipt_id);
  return jsonSuccess(data);
});
