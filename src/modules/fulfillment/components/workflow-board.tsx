"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type Worker = {
  id: string;
  name: string;
  role: string;
};

type FulfillmentOrder = {
  id: string;
  order_number?: string | null;
  status: string;
  priority: string;
  created_at: string;
  customer?: { name?: string | null } | null;
  order_items: Array<{ id: string; quantity: number; picked_quantity: number; product?: { name?: string | null; sku?: string | null } | null }>;
  picking?: { id: string; status: string; route_code?: string | null; worker_id?: string | null; worker?: { name?: string | null } | null } | null;
  shipment?: { id: string; status: string; tracking_number?: string | null; carrier?: { name?: string | null } | null } | null;
};

type WorkflowBoardProps = {
  orders: FulfillmentOrder[];
  workers: Worker[];
};

function statusTone(status: string) {
  switch (status) {
    case "shipped":
      return "bg-emerald-100 text-emerald-700";
    case "packed":
      return "bg-sky-100 text-sky-700";
    case "picked":
      return "bg-indigo-100 text-indigo-700";
    case "pick_ready":
    case "picking_assigned":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

export function WorkflowBoard({ orders, workers }: WorkflowBoardProps) {
  const router = useRouter();
  const [pickerAssignments, setPickerAssignments] = useState<Record<string, string>>({});
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(key: string, url: string, payload: Record<string, unknown>) {
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Workflow action failed.");
      }

      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workflow action failed.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Execution board</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Drive orders through pick, pack, and ship</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Use the workflow controls below to generate pick lists, assign labor, confirm warehouse execution, and complete shipment release.
        </p>
      </div>
      {error ? <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {orders.length === 0 ? (
        <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          No fulfillment orders available yet.
        </article>
      ) : (
        orders.map((order) => {
          const assignmentValue = pickerAssignments[order.id] ?? workers[0]?.id ?? "";
          const shipmentTracking = trackingNumbers[order.id] ?? order.shipment?.tracking_number ?? "";

          return (
            <article key={order.id} className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link className="text-2xl font-semibold tracking-tight text-slate-900 underline-offset-4 hover:underline" href={`/fulfillment/${order.id}`}>
                      {order.order_number ?? order.id}
                    </Link>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      {order.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {order.customer?.name ?? "No customer"} - {new Date(order.created_at).toLocaleString()}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    {order.order_items.map((item) => (
                      <p key={item.id}>
                        <span className="font-semibold text-slate-900">{item.product?.sku ?? item.product?.name ?? "Unknown product"}</span>
                        {" - Qty "}{item.quantity}{" - Picked "}{item.picked_quantity}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="min-w-[260px] rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 text-sm text-slate-600">
                  <p>Pick route: <span className="font-semibold text-slate-900">{order.picking?.route_code ?? "Not generated"}</span></p>
                  <p className="mt-2">Picker: <span className="font-semibold text-slate-900">{order.picking?.worker?.name ?? "Unassigned"}</span></p>
                  <p className="mt-2">Shipment: <span className="font-semibold text-slate-900">{order.shipment?.status ?? "Not packed"}</span></p>
                  <p className="mt-2">Tracking: <span className="font-semibold text-slate-900">{order.shipment?.tracking_number ?? "Pending"}</span></p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                <button
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pendingKey === `pick-${order.id}` || !["created", "draft"].includes(order.status)}
                  onClick={() => runAction(`pick-${order.id}`, "/api/orders/pick-list", { order_id: order.id })}
                  type="button"
                >
                  Generate pick list
                </button>

                <div className="grid gap-3 xl:col-span-1">
                  <select
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900"
                    onChange={(event) => setPickerAssignments((current) => ({ ...current, [order.id]: event.target.value }))}
                    value={assignmentValue}
                  >
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} - {worker.role}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pendingKey === `assign-${order.id}` || !order.picking?.id || order.status !== "pick_ready" || workers.length === 0}
                    onClick={() => runAction(`assign-${order.id}`, "/api/picking/assign", { picking_id: order.picking?.id, worker_id: assignmentValue })}
                    type="button"
                  >
                    Assign picker
                  </button>
                </div>

                <button
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pendingKey === `confirm-${order.id}` || !order.picking?.id || !["assigned", "ready"].includes(order.picking?.status ?? "")}
                  onClick={() => runAction(`confirm-${order.id}`, "/api/picking/confirm", { picking_id: order.picking?.id })}
                  type="button"
                >
                  Confirm picking
                </button>

                <div className="grid gap-3">
                  <input
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900"
                    onChange={(event) => setTrackingNumbers((current) => ({ ...current, [order.id]: event.target.value }))}
                    placeholder="Tracking number"
                    value={shipmentTracking}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pendingKey === `pack-${order.id}` || !["picked", "packed"].includes(order.status)}
                      onClick={() => runAction(`pack-${order.id}`, "/api/shipments/pack", { order_id: order.id, tracking_number: shipmentTracking || null })}
                      type="button"
                    >
                      Pack shipment
                    </button>
                    <button
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pendingKey === `ship-${order.id}` || !order.shipment?.id || order.shipment.status !== "packed"}
                      onClick={() => runAction(`ship-${order.id}`, "/api/shipments/ship", { shipment_id: order.shipment?.id })}
                      type="button"
                    >
                      Ship order
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
