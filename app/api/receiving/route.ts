import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createReceiptSchema, listReceivingQuerySchema } from "@/modules/receiving/schemas";
import { createReceipt, listReceipts } from "@/modules/receiving/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listReceivingQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listReceipts(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createReceiptSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createReceipt(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
