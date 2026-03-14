"use client";

import { useState } from "react";

type BarcodeResult = {
  id: string;
  quantity: number;
  status: string;
  products?: {
    name?: string | null;
    sku?: string | null;
    barcode?: string | null;
  } | null;
  locations?: {
    code?: string | null;
  } | null;
  lots?: {
    lot_number?: string | null;
    serial_number?: string | null;
  } | null;
};

export function BarcodeSearchCard() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BarcodeResult[]>([]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/barcode?code=${encodeURIComponent(code)}`);
      const payload = (await response.json()) as {
        success: boolean;
        data?: { rows: BarcodeResult[] };
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Barcode search failed.");
      }

      setResults(payload.data?.rows ?? []);
    } catch (searchError) {
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : "Barcode search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Barcode search</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Find stock by scan code</h2>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
        <input
          className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400"
          placeholder="Scan barcode or enter SKU"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !code.trim()}
          type="submit"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-5 space-y-3">
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">Search results will appear here with matching location and lot details.</p>
        ) : (
          results.map((row) => (
            <div key={row.id} className="rounded-[22px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{row.products?.name ?? "Unknown product"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {row.products?.sku ?? "No SKU"} � {row.products?.barcode ?? "No barcode"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {row.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p>Qty: <span className="font-semibold text-slate-900">{row.quantity}</span></p>
                <p>Location: <span className="font-semibold text-slate-900">{row.locations?.code ?? "N/A"}</span></p>
                <p>Lot: <span className="font-semibold text-slate-900">{row.lots?.lot_number ?? row.lots?.serial_number ?? "N/A"}</span></p>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
