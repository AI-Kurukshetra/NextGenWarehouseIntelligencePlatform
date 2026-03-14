"use client";

import { useState } from "react";

type InventoryOption = {
  id: string;
  label: string;
};

type StockAdjustmentCardProps = {
  inventoryOptions: InventoryOption[];
};

export function StockAdjustmentCard({ inventoryOptions }: StockAdjustmentCardProps) {
  const [inventoryId, setInventoryId] = useState(inventoryOptions[0]?.id ?? "");
  const [quantityDelta, setQuantityDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory_id: inventoryId,
          quantity_delta: Number(quantityDelta),
          reason,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Stock adjustment failed.");
      }

      setMessage("Adjustment submitted successfully. Refresh the page to see updated balances.");
      setQuantityDelta("0");
      setReason("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Stock adjustment failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Stock adjustments</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Post a quantity correction</h2>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-slate-600">
          Inventory line
          <select
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
            onChange={(event) => setInventoryId(event.target.value)}
            value={inventoryId}
          >
            {inventoryOptions.length === 0 ? <option value="">No inventory lines available</option> : null}
            {inventoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-600">
          Quantity delta
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
            onChange={(event) => setQuantityDelta(event.target.value)}
            type="number"
            value={quantityDelta}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-600">
          Reason
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Cycle count variance, damage, recount"
            value={reason}
          />
        </label>
        <button
          className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !inventoryId || Number(quantityDelta) === 0}
          type="submit"
        >
          {loading ? "Saving..." : "Apply adjustment"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
    </article>
  );
}
