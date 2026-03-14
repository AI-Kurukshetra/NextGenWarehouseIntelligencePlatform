import { handleRoute, jsonSuccess, parseJsonBody, parseParams } from "@/lib/api/route";
import { idParamsSchema } from "@/lib/api/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateShipmentSchema } from "@/modules/shipments/schemas";
import { deleteShipment, getShipmentById, updateShipment } from "@/modules/shipments/service";

export const GET = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await getShipmentById(supabase, id);
  return jsonSuccess(data);
});

export const PATCH = handleRoute(async (request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const payload = await parseJsonBody(request, updateShipmentSchema);
  const supabase = await createServerSupabaseClient();
  const data = await updateShipment(supabase, id, payload);
  return jsonSuccess(data);
});

export const DELETE = handleRoute(async (_request, context) => {
  const { id } = await parseParams(context, idParamsSchema);
  const supabase = await createServerSupabaseClient();
  const data = await deleteShipment(supabase, id);
  return jsonSuccess(data);
});
