import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { BarcodeSearchCard } from "@/modules/inventory/components/barcode-search-card";
import { StockAdjustmentCard } from "@/modules/inventory/components/stock-adjustment-card";
import { getInventoryModuleSnapshot } from "@/modules/inventory/service";

export default async function InventoryPage() {
  let snapshot: Awaited<ReturnType<typeof getInventoryModuleSnapshot>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    snapshot = await getInventoryModuleSnapshot(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load inventory data.";
  }

  const inventoryOptions = (snapshot?.inventoryRows ?? []).map((row) => ({
    id: row.id,
    label: `${row.products?.sku ?? "NO-SKU"} â€¢ ${row.locations?.code ?? "NO-LOC"} â€¢ Qty ${row.quantity}`,
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Inventory</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Inventory management</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Search inventory by barcode, track storage locations, review lots, and make controlled stock adjustments from the same workspace.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/inventory/locations" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            View locations
          </Link>
          <Link href="/api/inventory?limit=25" className="theme-primary-cta rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
            Inventory API
          </Link>
        </div>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>On hand</CardDescription><CardTitle className="text-3xl">{formatNumber(snapshot?.summary.onHand ?? 0)}</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-slate-500">Available quantity across visible inventory rows.</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Reserved</CardDescription><CardTitle className="text-3xl">{formatNumber(snapshot?.summary.reserved ?? 0)}</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-slate-500">Units already committed to open fulfillment work.</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Low stock</CardDescription><CardTitle className="text-3xl">{formatNumber(snapshot?.summary.lowStock ?? 0)}</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-slate-500">Inventory lines at or below the threshold.</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active locations</CardDescription><CardTitle className="text-3xl">{formatNumber(snapshot?.summary.activeLocations ?? 0)}</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-slate-500">Live storage positions currently enabled.</CardContent></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inventory list</CardTitle>
            <CardDescription>Current stock by product, location, and lot.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot?.inventoryRows.length ? (
                    snapshot.inventoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-950">{row.products?.name ?? "Unknown product"}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.products?.sku ?? "No SKU"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.locations?.code ?? "-"}</TableCell>
                        <TableCell>{row.lots?.lot_number ?? row.lots?.serial_number ?? "-"}</TableCell>
                        <TableCell>{formatNumber(row.quantity)}</TableCell>
                        <TableCell><Badge variant={row.status === "available" ? "success" : "warning"}>{row.status}</Badge></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>No inventory records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <BarcodeSearchCard />
          <StockAdjustmentCard inventoryOptions={inventoryOptions} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent adjustments</CardTitle>
            <CardDescription>Latest inventory balance changes written to the audit stream.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot?.recentAdjustments.length ? (
              snapshot.recentAdjustments.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{row.inventory?.products?.sku ?? row.inventory?.products?.name ?? "Adjustment"}</p>
                      <p className="mt-1 text-sm text-slate-500">{row.inventory?.locations?.code ?? "No location"} â€¢ {row.reason ?? "No reason"}</p>
                    </div>
                    <Badge variant={Number(row.quantity_delta) >= 0 ? "success" : "danger"}>
                      {Number(row.quantity_delta) >= 0 ? "+" : ""}{row.quantity_delta}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(row.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent adjustments found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracked lots</CardTitle>
            <CardDescription>Expiration-aware and serial-aware traceability snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot?.lots.length ? (
              snapshot.lots.map((lot) => (
                <div key={lot.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{lot.products?.name ?? "Unknown product"}</p>
                      <p className="mt-1 text-sm text-slate-500">{lot.products?.sku ?? "No SKU"} â€¢ {lot.lot_number ?? lot.serial_number ?? "No lot id"}</p>
                    </div>
                    <Badge variant="warning">{lot.expiration_date ? formatDate(lot.expiration_date) : "No expiry"}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No lots found.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

