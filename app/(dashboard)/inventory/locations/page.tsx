import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getLocationTrackingSnapshot } from "@/modules/locations/service";

export default async function InventoryLocationsPage() {
  let snapshot: Awaited<ReturnType<typeof getLocationTrackingSnapshot>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    snapshot = await getLocationTrackingSnapshot(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load location tracking.";
  }

  const rows = snapshot?.rows ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_22%),linear-gradient(180deg,#f8f3ea_0%,#efe6d7_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(41,37,36,0.86))] p-6 text-stone-50 shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                Location tracking
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Track storage pressure by zone and bin.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                Watch active slots, identify congested bins, and inspect how much stock is sitting in each location without leaving the dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900" href="/inventory">
                Inventory operations
              </Link>
              <Link className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white" href="/api/locations?limit=25">
                Locations API
              </Link>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Total locations</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{snapshot?.totalLocations ?? 0}</p>
          </article>
          <article className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Active locations</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{snapshot?.activeLocations ?? 0}</p>
          </article>
          <article className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Congested bins</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{snapshot?.congestedLocations ?? 0}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {rows.length === 0 ? (
            <article className="rounded-[28px] border border-white/50 bg-white/80 p-5 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              No locations available.
            </article>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="rounded-[30px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{row.code}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.zones?.code ?? "No zone"} � {row.location_type}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Bin: <span className="font-semibold text-slate-900">{row.bin ?? "N/A"}</span></p>
                  <p>Lines: <span className="font-semibold text-slate-900">{row.lineCount}</span></p>
                  <p>On hand: <span className="font-semibold text-slate-900">{row.onHand}</span></p>
                  <p>Reserved: <span className="font-semibold text-slate-900">{row.reserved}</span></p>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>Utilization</span>
                    <span>{row.utilization ?? 0}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-stone-200">
                    <div
                      className={`h-3 rounded-full ${(row.utilization ?? 0) >= 85 ? "bg-rose-500" : (row.utilization ?? 0) >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.max(Math.min(row.utilization ?? 0, 100), 4)}%` }}
                    />
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
