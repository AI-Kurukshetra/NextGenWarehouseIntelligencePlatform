import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function CycleCountsPage() {
  let rows: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase
      .from("cycle_counts")
      .select("id, status, variance, scheduled_for, counted_at, locations ( code )")
      .order("created_at", { ascending: false })
      .limit(25);
    rows = result.data ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load cycle counts.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Cycle counts</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Cycle count program</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Track scheduled counts, count completion, and variance outcomes across warehouse locations.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Count queue</CardTitle>
          <CardDescription>Current cycle counts in the warehouse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Counted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-950">{Array.isArray(row.locations) ? row.locations[0]?.code ?? "-" : row.locations?.code ?? "-"}</TableCell>
                      <TableCell><Badge>{row.status}</Badge></TableCell>
                      <TableCell>{row.variance}</TableCell>
                      <TableCell>{formatDate(row.scheduled_for)}</TableCell>
                      <TableCell>{formatDate(row.counted_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No cycle counts found.</TableCell>
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

