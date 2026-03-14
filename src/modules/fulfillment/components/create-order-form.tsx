"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
};

type OrderItemState = {
  product_id: string;
  quantity: string;
};

type CreateOrderFormProps = {
  products: ProductOption[];
};

export function CreateOrderForm({ products }: CreateOrderFormProps) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [priority, setPriority] = useState("normal");
  const [items, setItems] = useState<OrderItemState[]>([
    { product_id: products[0]?.id ?? "", quantity: "1" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateItem(index: number, nextItem: OrderItemState) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? nextItem : item)));
  }

  function addItem() {
    setItems((current) => [...current, { product_id: products[0]?.id ?? "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_number: orderNumber || null,
          priority,
          items: items
            .filter((item) => item.product_id && Number(item.quantity) > 0)
            .map((item) => ({
              product_id: item.product_id,
              quantity: Number(item.quantity),
            })),
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Failed to create order.");
      }

      setMessage("Order created. Generate the pick list from the workflow board below.");
      setOrderNumber("");
      setPriority("normal");
      setItems([{ product_id: products[0]?.id ?? "", quantity: "1" }]);
      startTransition(() => router.refresh());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create order.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Create order</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Open a new fulfillment job</h2>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            Order number
            <input
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="SO-24031"
              value={orderNumber}
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Priority
            <select
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
              onChange={(event) => setPriority(event.target.value)}
              value={priority}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="rush">Rush</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3">
          {items.map((item, index) => (
            <div key={`${item.product_id}-${index}`} className="grid gap-3 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 md:grid-cols-[1.35fr_0.6fr_auto]">
              <label className="grid gap-2 text-sm text-slate-600">
                Product
                <select
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
                  onChange={(event) => updateItem(index, { ...item, product_id: event.target.value })}
                  value={item.product_id}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Quantity
                <input
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-900"
                  min="1"
                  onChange={(event) => updateItem(index, { ...item, quantity: event.target.value })}
                  type="number"
                  value={item.quantity}
                />
              </label>
              <button
                className="self-end rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
                disabled={items.length === 1}
                onClick={() => removeItem(index)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-700" onClick={addItem} type="button">
            Add line
          </button>
          <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || products.length === 0} type="submit">
            {pending ? "Creating..." : "Create order"}
          </button>
        </div>
      </form>
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
    </article>
  );
}
