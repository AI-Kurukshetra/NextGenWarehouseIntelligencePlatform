import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListLotsInput = {
  limit: number;
  offset: number;
  q: string;
  product_id?: string;
};

type CreateLotInput = {
  product_id: string;
  lot_number?: string | null;
  serial_number?: string | null;
  expiration_date?: string | null;
  manufactured_at?: string | null;
};

type UpdateLotInput = Partial<CreateLotInput>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    throw new ApiError(400, fallbackMessage, error.message);
  }
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function listLots(client: AppSupabaseClient, input: ListLotsInput) {
  let query = client
    .from("lots")
    .select("id, lot_number, serial_number, expiration_date, manufactured_at, product_id, products ( id, name, sku, barcode )", { count: "exact" })
    .order("expiration_date", { ascending: true })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.product_id) {
    query = query.eq("product_id", input.product_id);
  }

  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch lots.");

  const normalizedRows = (data ?? []).map((row) => ({
    ...row,
    products: pickOne(row.products),
  }));

  const rows = normalizedRows.filter((row) => {
    if (!input.q) {
      return true;
    }

    const needle = input.q.toLowerCase();
    return [row.lot_number, row.serial_number, row.products?.name, row.products?.sku, row.products?.barcode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  return {
    rows,
    count: input.q ? rows.length : count ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function createLot(client: AppSupabaseClient, input: CreateLotInput) {
  const { data, error } = await client.from("lots").insert(input).select("*").single();
  throwIfError(error, "Failed to create lot.");
  return data;
}

export async function getLotById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("lots").select("*, products ( id, name, sku, barcode )").eq("id", id).single();
  throwIfError(error, "Failed to fetch lot.");
  return {
    ...data,
    products: pickOne(data?.products),
  };
}

export async function updateLot(client: AppSupabaseClient, id: string, input: UpdateLotInput) {
  const { data, error } = await client.from("lots").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update lot.");
  return data;
}
