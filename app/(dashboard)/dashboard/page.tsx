import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { getDashboardPageData } from "@/modules/dashboard/service";

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-slate-500">{detail}</CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    data = await getDashboardPageData(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load dashboard data.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-8 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Operations overview</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight">Warehouse dashboard</h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Review inventory health, outbound execution, shipment readiness, current labor allocation, and slotting opportunities from a single authenticated control surface.
            </p>
          </div>
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3 lg:min-w-[420px] lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Active orders</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(data?.orderSummary.active ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Pending shipments</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(data?.shipmentSummary.pending ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Optimization opportunities</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(data?.optimizationSummary.opportunities ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Inventory on hand" value={formatNumber(data?.inventorySummary.onHand ?? 0)} detail="Units available across the latest visible inventory lines." />
        <MetricCard label="Reserved stock" value={formatNumber(data?.inventorySummary.reserved ?? 0)} detail="Units already committed to outbound work." />
        <MetricCard label="Active orders" value={formatNumber(data?.orderSummary.active ?? 0)} detail={`${formatNumber(data?.orderSummary.pickReady ?? 0)} orders are pick-ready or assigned.`} />
        <MetricCard label="Pending shipments" value={formatNumber(data?.shipmentSummary.pending ?? 0)} detail={`${formatNumber(data?.shipmentSummary.shippedToday ?? 0)} shipments already marked shipped.`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse activity</CardTitle>
            <CardDescription>Live labor view across the warehouse floor.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.workers.length ? (
                    data.workers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium text-slate-950">{worker.name}</TableCell>
                        <TableCell>{worker.role}</TableCell>
                        <TableCell>
                          <Badge variant={worker.status === "active" ? "success" : "warning"}>{worker.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3}>No worker activity records available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Optimization</CardTitle>
              <CardDescription>AI slotting recommendations for high-frequency items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Opportunities</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(data?.optimizationSummary.opportunities ?? 0)}</p>
              </div>
              {data?.optimizationSummary.topRecommendation ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Top suggestion</p>
                  <p className="mt-2 font-semibold text-slate-950">{data.optimizationSummary.topRecommendation.product_sku}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Move from {data.optimizationSummary.topRecommendation.current_location_code} to {data.optimizationSummary.topRecommendation.recommended_location_code}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{data.optimizationSummary.topRecommendation.reason}</p>
                  <Link href="/optimization" className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Review recommendations
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No slotting opportunities detected in the last 30 days.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick navigation</CardTitle>
              <CardDescription>Jump directly into the active warehouse modules.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(data?.quickLinks ?? []).map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active orders</CardTitle>
            <CardDescription>Most recent outbound orders moving through the workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.length ? (
                    data.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-slate-950">{order.order_number ?? order.id.slice(0, 8)}</TableCell>
                        <TableCell>{((Array.isArray(order.customers) ? order.customers[0] : order.customers) as { name?: string } | null)?.name ?? "-"}</TableCell>
                        <TableCell><Badge>{order.status}</Badge></TableCell>
                        <TableCell>{order.priority}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No orders found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent operations</CardTitle>
            <CardDescription>Latest events from receiving, inventory, and shipping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentOperations.length ? (
              data.recentOperations.map((operation) => (
                <div key={operation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{operation.type}</p>
                      <p className="mt-1 text-sm text-slate-500">{operation.description}</p>
                    </div>
                    <Badge variant="outline">{operation.outcome}</Badge>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(String(operation.timestamp))}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent operations yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
