import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function ReturnsPage() {
  let rows: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase
      .from("returns")
      .select("id, status, disposition, received_at, orders ( order_number )")
      .order("created_at", { ascending: false })
      .limit(25);
    rows = result.data ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load returns.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Returns</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Returns processing</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Review returned orders and the current disposition decision for each received return.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Returns queue</CardTitle>
          <CardDescription>Latest returns and their disposition state.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-950">{Array.isArray(row.orders) ? row.orders[0]?.order_number ?? "-" : row.orders?.order_number ?? "-"}</TableCell>
                      <TableCell><Badge>{row.status}</Badge></TableCell>
                      <TableCell>{row.disposition ?? "Pending"}</TableCell>
                      <TableCell>{formatDate(row.received_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No returns found.</TableCell>
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

