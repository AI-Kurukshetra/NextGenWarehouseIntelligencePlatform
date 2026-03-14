import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createProductSchema, listProductsQuerySchema } from "@/modules/products/schemas";
import { createProduct, listProducts } from "@/modules/products/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listProductsQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listProducts(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createProductSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createProduct(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
