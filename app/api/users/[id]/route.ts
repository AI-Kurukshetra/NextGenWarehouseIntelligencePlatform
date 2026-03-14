import { handleRoute, jsonSuccess, parseJsonBody, parseParams } from "@/lib/api/route";
import { idParamsSchema } from "@/lib/api/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateUserSchema } from "@/modules/users/schemas";
import { deleteUser, getUserById, updateUser } from "@/modules/users/service";

export const GET = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await getUserById(supabase, id);
  return jsonSuccess(data);
});

export const PATCH = handleRoute(async (request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const payload = await parseJsonBody(request, updateUserSchema);
  const supabase = await createServerSupabaseClient();
  const data = await updateUser(supabase, id, payload);
  return jsonSuccess(data);
});

export const DELETE = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await deleteUser(supabase, id);
  return jsonSuccess(data);
});
