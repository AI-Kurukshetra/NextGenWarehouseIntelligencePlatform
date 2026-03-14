import { handleRoute, jsonSuccess, parseJsonBody, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUserSchema, listUsersQuerySchema } from "@/modules/users/schemas";
import { createUser, listUsers } from "@/modules/users/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, listUsersQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listUsers(supabase, query);
  return jsonSuccess(data);
});

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, createUserSchema);
  const supabase = await createServerSupabaseClient();
  const data = await createUser(supabase, payload);
  return jsonSuccess(data, { status: 201 });
});
