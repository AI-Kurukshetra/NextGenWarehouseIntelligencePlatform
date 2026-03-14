import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { listShipments } from "@/modules/shipments/service";

export default async function ShippingPage() {
  let rows: Array<any> = [];
  let carriers: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const [shipments, carrierResult] = await Promise.all([
      listShipments(supabase, { limit: 25, offset: 0, q: "" }),
      supabase.from("carriers").select("id, name, code, service_level").order("name", { ascending: true }).limit(12),
    ]);
    rows = shipments.rows;
    carriers = carrierResult.data ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load shipping data.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Shipping</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Shipping operations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Manage shipment packing state, outbound readiness, and carrier coverage for active order waves.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Total shipments</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Packed</CardDescription><CardTitle className="text-3xl">{formatNumber(rows.filter((row) => row.status === "packed").length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Carriers</CardDescription><CardTitle className="text-3xl">{formatNumber(carriers.length)}</CardTitle></CardHeader></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Shipment queue</CardTitle>
            <CardDescription>Current outbound shipments and their shipping state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Shipped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-slate-950">{row.tracking_number ?? row.id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant={row.status === "shipped" ? "success" : "warning"}>{row.status}</Badge></TableCell>
                        <TableCell>{row.order_id}</TableCell>
                        <TableCell>{formatDate(row.shipped_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No shipments found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrier roster</CardTitle>
            <CardDescription>Configured carriers available for outbound fulfillment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {carriers.length ? (
              carriers.map((carrier) => (
                <div key={carrier.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{carrier.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{carrier.code ?? "No code"} • {carrier.service_level ?? "Standard"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No carriers found.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

