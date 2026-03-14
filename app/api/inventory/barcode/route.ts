import { handleRoute, jsonSuccess, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { barcodeSearchQuerySchema } from "@/modules/inventory/schemas";
import { searchInventoryByBarcode } from "@/modules/inventory/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, barcodeSearchQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await searchInventoryByBarcode(supabase, query.code);
  return jsonSuccess({ rows: data, count: data.length, code: query.code });
});
