import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { CreateOrderForm } from "@/modules/fulfillment/components/create-order-form";
import { WorkflowBoard } from "@/modules/fulfillment/components/workflow-board";
import { getFulfillmentPageData } from "@/modules/fulfillment/service";

export default async function OrdersPage() {
  let data: Awaited<ReturnType<typeof getFulfillmentPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    data = await getFulfillmentPageData(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load order workflow data.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Orders</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Order fulfillment workflow</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Create outbound orders, generate pick lists, assign warehouse labor, confirm picks, pack shipments, and release orders for carrier dispatch from one queue.
        </p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open workflow</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(data?.summary.created ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">Orders created, pick-ready, or picker-assigned.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Picked</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(data?.summary.picked ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">Orders completed on the floor and ready for pack.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Packed</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(data?.summary.packed ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">Orders staged for carrier handoff.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shipped</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(data?.summary.shipped ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-500">Orders completed in the workflow.</CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CreateOrderForm products={data?.products ?? []} />
        <Card>
          <CardHeader>
            <CardTitle>Order queue</CardTitle>
            <CardDescription>Latest orders and their current workflow step.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Picker</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.length ? (
                    data.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-slate-950">{order.order_number ?? order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{order.priority}</TableCell>
                        <TableCell>{formatNumber(order.order_items.length)}</TableCell>
                        <TableCell>{order.picking?.worker?.name ?? "Unassigned"}</TableCell>
                        <TableCell>{order.shipment?.status ?? "Not created"}</TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>No orders available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <WorkflowBoard orders={data?.orders ?? []} workers={data?.workers ?? []} />
    </div>
  );
}
