import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { listPickings } from "@/modules/picking/service";

export default async function PickingPage() {
  let rows: Array<any> = [];
  let workers: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const [pickings, workerResult] = await Promise.all([
      listPickings(supabase, { limit: 25, offset: 0, q: "" }),
      supabase.from("workers").select("id, name, role, status").order("name", { ascending: true }).limit(12),
    ]);
    rows = pickings.rows;
    workers = workerResult.data ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load picking data.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Picking</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Picking operations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Review generated pick lists, current route assignments, and active warehouse picking capacity.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Total pickings</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Assigned</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.filter((row) => row.status === "assigned").length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active workers</CardDescription><CardTitle className="text-3xl">{formatNumber(workers.filter((worker) => worker.status === "active").length)}</CardTitle></CardHeader></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pick list queue</CardTitle>
            <CardDescription>Most recent picking assignments and route progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-slate-950">{row.route_code ?? row.id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant={row.status === "completed" ? "success" : "warning"}>{row.status}</Badge></TableCell>
                        <TableCell>{row.worker_id ?? "Unassigned"}</TableCell>
                        <TableCell>{formatDate(row.started_at)}</TableCell>
                        <TableCell>{formatDate(row.completed_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>No picking work found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker availability</CardTitle>
            <CardDescription>Warehouse staff that can be assigned to pick work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workers.length ? (
              workers.map((worker) => (
                <div key={worker.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{worker.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{worker.role}</p>
                  <Badge className="mt-3" variant={worker.status === "active" ? "success" : "warning"}>{worker.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No worker availability records found.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

