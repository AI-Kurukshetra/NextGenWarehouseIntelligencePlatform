import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListUsersInput = {
  limit: number;
  offset: number;
  q: string;
};

type CreateUserInput = {
  id: string;
  name: string;
  email: string;
  role: string;
  warehouse_id?: string | null;
  client_id?: string | null;
  status: string;
};

type UpdateUserInput = Partial<Omit<CreateUserInput, "id">>;

function throwIfError(error: { message: string } | null, fallbackMessage: string) {
  if (error) throw new ApiError(400, fallbackMessage, error.message);
}

export async function listUsers(client: AppSupabaseClient, input: ListUsersInput) {
  let query = client.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
  if (input.q) query = query.or(`name.ilike.%${input.q}%,email.ilike.%${input.q}%`);
  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch users.");
  return { rows: data ?? [], count: count ?? 0, limit: input.limit, offset: input.offset };
}

export async function createUser(client: AppSupabaseClient, input: CreateUserInput) {
  const { data, error } = await client.from("users").insert(input).select("*").single();
  throwIfError(error, "Failed to create user.");
  return data;
}

export async function getUserById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("users").select("*").eq("id", id).single();
  throwIfError(error, "Failed to fetch user.");
  return data;
}

export async function updateUser(client: AppSupabaseClient, id: string, input: UpdateUserInput) {
  const { data, error } = await client.from("users").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update user.");
  return data;
}

export async function deleteUser(client: AppSupabaseClient, id: string) {
  const { error } = await client.from("users").delete().eq("id", id);
  throwIfError(error, "Failed to delete user.");
  return { id };
}
