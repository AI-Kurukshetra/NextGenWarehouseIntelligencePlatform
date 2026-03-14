import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListLocationsInput = {
  limit: number;
  offset: number;
  q: string;
  warehouse_id?: string;
  zone_id?: string;
};

type CreateLocationInput = {
  warehouse_id: string;
  zone_id?: string | null;
  code: string;
  bin?: string | null;
  capacity?: number | null;
  location_type: string;
  is_active: boolean;
};

type UpdateLocationInput = Partial<CreateLocationInput>;

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

export async function listLocations(client: AppSupabaseClient, input: ListLocationsInput) {
  let query = client
    .from("locations")
    .select("id, code, bin, capacity, location_type, is_active, warehouse_id, zone_id, zones ( id, code, name )", { count: "exact" })
    .order("code", { ascending: true })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.warehouse_id) {
    query = query.eq("warehouse_id", input.warehouse_id);
  }

  if (input.zone_id) {
    query = query.eq("zone_id", input.zone_id);
  }

  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch locations.");

  const normalizedRows = (data ?? []).map((row) => ({
    ...row,
    zones: pickOne(row.zones),
  }));

  const rows = normalizedRows.filter((row) => {
    if (!input.q) {
      return true;
    }

    const needle = input.q.toLowerCase();
    return [row.code, row.bin, row.location_type, row.zones?.code, row.zones?.name]
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

export async function createLocation(client: AppSupabaseClient, input: CreateLocationInput) {
  const { data, error } = await client.from("locations").insert(input).select("*").single();
  throwIfError(error, "Failed to create location.");
  return data;
}

export async function getLocationById(client: AppSupabaseClient, id: string) {
  const { data, error } = await client.from("locations").select("*, zones ( id, code, name )").eq("id", id).single();
  throwIfError(error, "Failed to fetch location.");
  return {
    ...data,
    zones: pickOne(data?.zones),
  };
}

export async function updateLocation(client: AppSupabaseClient, id: string, input: UpdateLocationInput) {
  const { data, error } = await client.from("locations").update(input).eq("id", id).select("*").single();
  throwIfError(error, "Failed to update location.");
  return data;
}

export async function getLocationTrackingSnapshot(client: AppSupabaseClient) {
  const { data, error } = await client
    .from("locations")
    .select("id, code, bin, capacity, location_type, is_active, zones ( id, code, name ), inventory ( id, quantity, reserved_quantity )")
    .order("code", { ascending: true })
    .limit(24);
  throwIfError(error, "Failed to fetch location tracking snapshot.");

  const rows = (data ?? []).map((location) => {
    const inventory = location.inventory ?? [];
    const onHand = inventory.reduce((sum: number, row: { quantity?: number | null }) => sum + Number(row.quantity ?? 0), 0);
    const reserved = inventory.reduce((sum: number, row: { reserved_quantity?: number | null }) => sum + Number(row.reserved_quantity ?? 0), 0);
    const capacity = Number(location.capacity ?? 0);
    const utilization = capacity > 0 ? Math.min(Math.round((onHand / capacity) * 100), 999) : null;

    return {
      ...location,
      zones: pickOne(location.zones),
      onHand,
      reserved,
      utilization,
      lineCount: inventory.length,
    };
  });

  return {
    totalLocations: rows.length,
    activeLocations: rows.filter((row) => row.is_active).length,
    congestedLocations: rows.filter((row) => (row.utilization ?? 0) >= 85).length,
    rows,
  };
}
