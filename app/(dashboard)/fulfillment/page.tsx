import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateOrderForm } from "@/modules/fulfillment/components/create-order-form";
import { WorkflowBoard } from "@/modules/fulfillment/components/workflow-board";
import { getFulfillmentPageData } from "@/modules/fulfillment/service";

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

export default async function FulfillmentPage() {
  let data: Awaited<ReturnType<typeof getFulfillmentPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    data = await getFulfillmentPageData(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load fulfillment workflow.";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_22%),linear-gradient(180deg,#f8f3ea_0%,#efe6d7_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(41,37,36,0.86))] p-6 text-stone-50 shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                Fulfillment workflow
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Create, pick, pack, and ship from one queue.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                This workflow orchestrates the full warehouse order lifecycle: create the order, generate the pick list, assign a picker, confirm the pick, pack the shipment, and release it for shipping.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900" href="/dashboard">
                Dashboard
              </Link>
              <Link className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white" href="/api/orders?limit=20">
                Orders API
              </Link>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Open workflow" value={String(data?.summary.created ?? 0)} detail="Orders created, pick-ready, or picker-assigned" />
          <SummaryCard label="Picked" value={String(data?.summary.picked ?? 0)} detail="Orders completed on the floor and ready for pack" />
          <SummaryCard label="Packed" value={String(data?.summary.packed ?? 0)} detail="Orders waiting for carrier handoff" />
          <SummaryCard label="Shipped" value={String(data?.summary.shipped ?? 0)} detail="Orders fully released from the warehouse" />
        </section>

        <CreateOrderForm products={data?.products ?? []} />
        <WorkflowBoard orders={data?.orders ?? []} workers={data?.workers ?? []} />
      </div>
    </main>
  );
}
