import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateSlottingRecommendations } from "@/lib/optimization/slotting";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplyRecommendationButton } from "@/modules/optimization/components/apply-recommendation-button";

export default async function OptimizationPage() {
  let recommendations: Awaited<ReturnType<typeof generateSlottingRecommendations>> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    recommendations = await generateSlottingRecommendations(supabase, { limit: 50, persist: true });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load slotting recommendations.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Optimization</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">AI Warehouse Slotting Optimization</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Rank high-frequency products by recent pick activity and travel distance, then relocate them closer to shipping and packing zones.
        </p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Slotting recommendations</CardTitle>
          <CardDescription>Products with the strongest optimization score should be placed closer to outbound operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current location</TableHead>
                  <TableHead>Recommended location</TableHead>
                  <TableHead>Optimization score</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.length ? (
                  recommendations.map((recommendation) => (
                    <TableRow key={recommendation.id ?? `${recommendation.product_id}-${recommendation.current_location_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-950">{recommendation.product_sku}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{recommendation.product_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{recommendation.current_location_code}</TableCell>
                      <TableCell>{recommendation.recommended_location_code}</TableCell>
                      <TableCell>{recommendation.optimization_score.toFixed(2)}</TableCell>
                      <TableCell>{recommendation.reason}</TableCell>
                      <TableCell>
                        {recommendation.id ? <ApplyRecommendationButton recommendationId={recommendation.id} /> : <span className="text-sm text-slate-500">Unavailable</span>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No slotting recommendations available right now.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
