import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type ListInventoryInput = {
  limit: number;
  offset: number;
  q: string;
  product_id?: string;
  location_id?: string;
  status?: string;
};

type CreateInventoryInput = {
  client_id?: string | null;
  warehouse_id?: string | null;
  product_id: string;
  location_id: string;
  lot_id?: string | null;
  quantity: number;
  reserved_quantity: number;
  status: string;
};

type AdjustInventoryInput = {
  inventory_id: string;
  quantity_delta: number;
  reason?: string | null;
};

type TransferInventoryInput = {
  inventory_id: string;
  to_location_id: string;
  quantity: number;
};

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

function normalizeInventoryRow(row: any) {
  return {
    ...row,
    products: pickOne(row.products),
    locations: {
      ...pickOne(row.locations),
      zones: pickOne(pickOne(row.locations)?.zones),
    },
    lots: pickOne(row.lots),
  };
}

const inventorySelect = `
  id,
  quantity,
  reserved_quantity,
  available_quantity,
  status,
  created_at,
  updated_at,
  product_id,
  location_id,
  lot_id,
  products ( id, name, sku, barcode ),
  locations ( id, code, bin, capacity, location_type, zones ( id, code, name ) ),
  lots ( id, lot_number, serial_number, expiration_date )
`;

export async function listInventory(client: AppSupabaseClient, input: ListInventoryInput) {
  let query = client
    .from("inventory")
    .select(inventorySelect, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.product_id) {
    query = query.eq("product_id", input.product_id);
  }

  if (input.location_id) {
    query = query.eq("location_id", input.location_id);
  }

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, error, count } = await query;
  throwIfError(error, "Failed to fetch inventory.");

  const normalizedRows = (data ?? []).map(normalizeInventoryRow);
  const rows = normalizedRows.filter((row) => {
    if (!input.q) {
      return true;
    }

    const needle = input.q.toLowerCase();
    return [
      row.status,
      row.products?.name,
      row.products?.sku,
      row.products?.barcode,
      row.locations?.code,
      row.lots?.lot_number,
      row.lots?.serial_number,
    ]
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

export async function createInventoryLine(client: AppSupabaseClient, input: CreateInventoryInput) {
  const { data, error } = await client.from("inventory").insert(input).select("*").single();
  throwIfError(error, "Failed to create inventory record.");
  return data;
}

export async function adjustInventory(client: AppSupabaseClient, input: AdjustInventoryInput) {
  const { data: current, error: fetchError } = await client
    .from("inventory")
    .select("*")
    .eq("id", input.inventory_id)
    .single();
  throwIfError(fetchError, "Failed to fetch inventory record.");

  const nextQuantity = Number(current.quantity ?? 0) + input.quantity_delta;
  if (nextQuantity < 0) {
    throw new ApiError(400, "Inventory quantity cannot become negative.");
  }

  const { data: updated, error: updateError } = await client
    .from("inventory")
    .update({ quantity: nextQuantity })
    .eq("id", input.inventory_id)
    .select("*")
    .single();
  throwIfError(updateError, "Failed to adjust inventory.");

  const { error: adjustmentError } = await client.from("adjustments").insert({
    inventory_id: input.inventory_id,
    quantity_delta: input.quantity_delta,
    reason: input.reason ?? "manual-adjustment",
  });
  throwIfError(adjustmentError, "Failed to write adjustment record.");

  return updated;
}

export async function transferInventory(client: AppSupabaseClient, input: TransferInventoryInput) {
  const { data: source, error: sourceError } = await client
    .from("inventory")
    .select("*")
    .eq("id", input.inventory_id)
    .single();
  throwIfError(sourceError, "Failed to fetch source inventory.");

  if (Number(source.quantity ?? 0) < input.quantity) {
    throw new ApiError(400, "Insufficient inventory quantity for transfer.");
  }

  let targetQuery = client
    .from("inventory")
    .select("*")
    .eq("product_id", source.product_id)
    .eq("location_id", input.to_location_id);

  targetQuery = source.lot_id ? targetQuery.eq("lot_id", source.lot_id) : targetQuery.is("lot_id", null);

  const { data: target, error: targetError } = await targetQuery.maybeSingle();
  throwIfError(targetError, "Failed to fetch target inventory.");

  const { data: updatedSource, error: updateSourceError } = await client
    .from("inventory")
    .update({ quantity: Number(source.quantity ?? 0) - input.quantity })
    .eq("id", input.inventory_id)
    .select("*")
    .single();
  throwIfError(updateSourceError, "Failed to update source inventory.");

  let updatedTarget = target;
  if (target) {
    const { data, error } = await client
      .from("inventory")
      .update({ quantity: Number(target.quantity ?? 0) + input.quantity })
      .eq("id", target.id)
      .select("*")
      .single();
    throwIfError(error, "Failed to update target inventory.");
    updatedTarget = data;
  } else {
    const { data, error } = await client
      .from("inventory")
      .insert({
        client_id: source.client_id,
        warehouse_id: source.warehouse_id,
        product_id: source.product_id,
        location_id: input.to_location_id,
        lot_id: source.lot_id,
        quantity: input.quantity,
        reserved_quantity: 0,
        status: source.status,
      })
      .select("*")
      .single();
    throwIfError(error, "Failed to create target inventory.");
    updatedTarget = data;
  }

  return {
    source: updatedSource,
    target: updatedTarget,
  };
}

export async function searchInventoryByBarcode(client: AppSupabaseClient, code: string) {
  const { data: products, error: productError } = await client
    .from("products")
    .select("id")
    .or(`barcode.eq.${code},barcode.ilike.%${code}%,sku.ilike.%${code}%`)
    .limit(25);
  throwIfError(productError, "Failed to search products by barcode.");

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const { data, error } = await client
    .from("inventory")
    .select(inventorySelect)
    .in("product_id", productIds)
    .order("updated_at", { ascending: false })
    .limit(50);
  throwIfError(error, "Failed to fetch barcode inventory results.");

  return (data ?? []).map(normalizeInventoryRow);
}

export async function getInventoryModuleSnapshot(client: AppSupabaseClient) {
  const [inventoryResult, locationResult, lotResult, adjustmentsResult] = await Promise.all([
    client.from("inventory").select(inventorySelect).order("updated_at", { ascending: false }).limit(20),
    client.from("locations").select("id, code, bin, capacity, location_type, is_active, zones ( id, code, name )").order("code", { ascending: true }).limit(12),
    client.from("lots").select("id, lot_number, serial_number, expiration_date, products ( id, name, sku )").order("expiration_date", { ascending: true }).limit(12),
    client.from("adjustments").select("id, quantity_delta, reason, created_at, inventory_id, inventory ( id, locations ( code ), products ( sku, name ) )").order("created_at", { ascending: false }).limit(8),
  ]);

  throwIfError(inventoryResult.error, "Failed to fetch inventory snapshot.");
  throwIfError(locationResult.error, "Failed to fetch location snapshot.");
  throwIfError(lotResult.error, "Failed to fetch lot snapshot.");
  throwIfError(adjustmentsResult.error, "Failed to fetch recent adjustments.");

  const inventoryRows = (inventoryResult.data ?? []).map(normalizeInventoryRow);
  const locations = (locationResult.data ?? []).map((location) => ({
    ...location,
    zones: pickOne(location.zones),
  }));
  const lots = (lotResult.data ?? []).map((lot) => ({
    ...lot,
    products: pickOne(lot.products),
  }));
  const recentAdjustments = (adjustmentsResult.data ?? []).map((row) => ({
    ...row,
    inventory: {
      ...pickOne(row.inventory),
      locations: pickOne(pickOne(row.inventory)?.locations),
      products: pickOne(pickOne(row.inventory)?.products),
    },
  }));

  const onHand = inventoryRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
  const reserved = inventoryRows.reduce((sum, row) => sum + Number(row.reserved_quantity ?? 0), 0);
  const lowStock = inventoryRows.filter((row) => Number(row.quantity ?? 0) <= 10).length;
  const activeLocations = locations.filter((location) => location.is_active).length;

  return {
    summary: {
      onHand,
      reserved,
      lowStock,
      activeLocations,
    },
    inventoryRows,
    locations,
    lots,
    recentAdjustments,
  };
}
