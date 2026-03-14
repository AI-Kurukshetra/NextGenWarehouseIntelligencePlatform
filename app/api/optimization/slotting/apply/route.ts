import { handleRoute, jsonSuccess, parseJsonBody } from "@/lib/api/route";
import { applySlottingRecommendation } from "@/lib/optimization/slotting";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { applySlottingRecommendationSchema } from "@/modules/optimization/schemas";

export const POST = handleRoute(async (request) => {
  const payload = await parseJsonBody(request, applySlottingRecommendationSchema);
  const supabase = await createServerSupabaseClient();
  const result = await applySlottingRecommendation(supabase, payload.recommendation_id);
  return jsonSuccess(result);
});
