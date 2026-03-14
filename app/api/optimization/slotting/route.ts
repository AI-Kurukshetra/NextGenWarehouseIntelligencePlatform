import { handleRoute, jsonSuccess, parseQuery } from "@/lib/api/route";
import { generateSlottingRecommendations } from "@/lib/optimization/slotting";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slottingQuerySchema } from "@/modules/optimization/schemas";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, slottingQuerySchema);
  const supabase = await createServerSupabaseClient();
  const recommendations = await generateSlottingRecommendations(supabase, { limit: query.limit, persist: true });

  return jsonSuccess(
    recommendations.map((recommendation) => ({
      id: recommendation.id,
      product: recommendation.product_sku || recommendation.product_name,
      current_location: recommendation.current_location_code,
      recommended_location: recommendation.recommended_location_code,
      score: recommendation.optimization_score,
      reason: recommendation.reason,
    })),
  );
});
