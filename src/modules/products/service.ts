import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListProductsInput = {
  limit: number;
  offset: number;
  q: string;
};

type CreateProductInput = {
  client_id?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  unit_of_measure: string;
  is_active: boolean;
};

type UpdateProductInput = Partial<CreateProductInput>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listProducts(client: AppSupabaseClient, input: ListProductsInput) {
  let query = client.from("products").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`name.ilike.%${input.q}%,sku.ilike.%${input.q}%,barcode.ilike.%${input.q}%`);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch products.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createProduct(client: AppSupabaseClient, input: CreateProductInput) {
  const { data, error } = await client.from("products").insert(input).select("*").single();
  throwIfError(error, "Failed to create product.");
  return data;
}

export async function getProductById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("products").select("*").eq("id", id).single();
  throwIfError(error, "Failed to fetch product.");
  return data;
}

export async function updateProduct(client: AppSupabaseClient, id: string, input: UpdateProductInput) {
  const { data, error } = await client.from("products").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update product.");
  return data;
}

export async function deleteProduct(client: AppSupabaseClient, id: string) {
  const { error } = await client.from("products").delete().eq("id", id);
  throwIfError(error, "Failed to delete product.");
  return { id };
}
