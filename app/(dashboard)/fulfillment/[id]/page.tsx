import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listFulfillmentOrders } from "@/modules/fulfillment/service";

type FulfillmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

type FulfillmentDetailItem = {
  id: string;
  quantity: number;
  picked_quantity: number;
  product?: {
    name?: string | null;
    sku?: string | null;
  } | null;
};

const workflowSteps = ["created", "pick_ready", "picking_assigned", "picked", "packed", "shipped"];

export default async function FulfillmentDetailPage({ params }: FulfillmentDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const data = await listFulfillmentOrders(supabase, { limit: 100, offset: 0, q: "" });
  const order = data.rows.find((row) => row.id === id);

  if (!order) {
    notFound();
  }

  const stepIndex = workflowSteps.indexOf(order.status);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_22%),linear-gradient(180deg,#f8f3ea_0%,#efe6d7_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(41,37,36,0.86))] p-6 text-stone-50 shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                Order workflow detail
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{order.order_number ?? order.id}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                Detailed status across picking and shipping for this fulfillment order.
              </p>
            </div>
            <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900" href="/fulfillment">
              Back to workflow
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Workflow stages</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {workflowSteps.map((step, index) => (
              <div key={step} className={`rounded-[24px] border px-4 py-4 text-sm ${index <= stepIndex ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
                <p className="font-semibold uppercase tracking-[0.18em]">{step.replaceAll("_", " ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Order lines</p>
            <div className="mt-5 space-y-3">
              {order.order_items.map((item: FulfillmentDetailItem) => (
                <div key={item.id} className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
                  <p className="font-semibold text-slate-900">{item.product?.name ?? item.product?.sku ?? "Unknown product"}</p>
                  <p className="mt-2 text-sm text-slate-600">SKU: {item.product?.sku ?? "N/A"}</p>
                  <p className="mt-1 text-sm text-slate-600">Ordered: {item.quantity} � Picked: {item.picked_quantity}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Execution detail</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
                <p className="font-semibold text-slate-900">Picking</p>
                <p className="mt-2">Route: {order.picking?.route_code ?? "Not generated"}</p>
                <p className="mt-1">Picker: {order.picking?.worker?.name ?? "Unassigned"}</p>
                <p className="mt-1">Status: {order.picking?.status ?? "N/A"}</p>
              </div>
              <div className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
                <p className="font-semibold text-slate-900">Shipment</p>
                <p className="mt-2">Carrier: {order.shipment?.carrier?.name ?? "Not selected"}</p>
                <p className="mt-1">Tracking: {order.shipment?.tracking_number ?? "Pending"}</p>
                <p className="mt-1">Status: {order.shipment?.status ?? "Not packed"}</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
