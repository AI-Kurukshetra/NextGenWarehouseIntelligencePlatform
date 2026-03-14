import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { listReceipts } from "@/modules/receiving/service";

export default async function ReceivingPage() {
  let rows: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const result = await listReceipts(supabase, { limit: 25, offset: 0, q: "" });
    rows = result.rows;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load receiving data.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Receiving</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Inbound receiving</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Track inbound receipts, confirm dock work, and review which receipts still need warehouse confirmation.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Total receipts</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Draft</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.filter((row) => row.status === "draft").length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Received</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.filter((row) => row.status === "received").length)}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Receipt queue</CardTitle>
          <CardDescription>Latest inbound receipts across warehouse docks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-950">{row.receipt_number ?? row.id.slice(0, 8)}</TableCell>
                      <TableCell><Badge variant={row.status === "received" ? "success" : "warning"}>{row.status}</Badge></TableCell>
                      <TableCell>{formatDate(row.expected_at)}</TableCell>
                      <TableCell>{formatDate(row.received_at)}</TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No receipts available.</TableCell>
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

