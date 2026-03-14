import { handleRoute, jsonSuccess, parseJsonBody, parseParams } from "@/lib/api/route";
import { idParamsSchema } from "@/lib/api/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateReceiptSchema } from "@/modules/receiving/schemas";
import { getReceiptById, updateReceipt } from "@/modules/receiving/service";

export const GET = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await getReceiptById(supabase, id);
  return jsonSuccess(data);
});

export const PATCH = handleRoute(async (request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const payload = await parseJsonBody(request, updateReceiptSchema);
  const supabase = await createServerSupabaseClient();
  const data = await updateReceipt(supabase, id, payload);
  return jsonSuccess(data);
});
