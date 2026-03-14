import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/route";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

type LocationRow = {
  id: string;
  warehouse_id?: string | null;
  zone_id?: string | null;
  code?: string | null;
  bin?: string | null;
  capacity?: number | null;
  location_type?: string | null;
  is_active?: boolean | null;
  zones?: { id?: string | null; code?: string | null; name?: string | null } | Array<{ id?: string | null; code?: string | null; name?: string | null }> | null;
  inventory?: Array<{ id?: string | null; quantity?: number | null; reserved_quantity?: number | null }> | null;
};

type InventoryRow = {
  id: string;
  product_id: string;
  location_id: string;
  warehouse_id?: string | null;
  lot_id?: string | null;
  quantity?: number | null;
  reserved_quantity?: number | null;
  status?: string | null;
  products?: { id?: string | null; name?: string | null; sku?: string | null; barcode?: string | null } | Array<{ id?: string | null; name?: string | null; sku?: string | null; barcode?: string | null }> | null;
  locations?: LocationRow | LocationRow[] | null;
};

type OrderRow = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  pickings?: Array<{ completed_at?: string | null; status?: string | null }> | null;
  order_items?: Array<{ product_id?: string | null; picked_quantity?: number | null }> | null;
};

type NormalizedLocation = {
  id: string;
  warehouse_id: string | null;
  zone_id: string | null;
  code: string;
  bin: string | null;
  capacity: number | null;
  location_type: string;
  is_active: boolean;
  zone_code: string | null;
  zone_name: string | null;
  on_hand: number;
  reserved: number;
};

type GroupedInventory = {
  product_id: string;
  location_id: string;
  warehouse_id: string | null;
  quantity: number;
  reserved_quantity: number;
  inventory_ids: string[];
  product_name: string;
  product_sku: string;
  product_barcode: string | null;
  location: NormalizedLocation;
};

export type SlottingRecommendation = {
  id?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  current_location_id: string;
  current_location_code: string;
  recommended_location_id: string;
  recommended_location_code: string;
  optimization_score: number;
  pick_frequency: number;
  travel_distance: number;
  recommended_distance: number;
  reason: string;
};

const SHIPPING_TERMS = /ship|pack|stage|dispatch|dock/i;
const LOCATION_PARTS = /([A-Za-z]+)?\s*-?\s*(\d+)?/;

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

function normalizeLocation(row: LocationRow): NormalizedLocation {
  const zone = pickOne(row.zones);
  const inventory = row.inventory ?? [];

  return {
    id: row.id,
    warehouse_id: row.warehouse_id ?? null,
    zone_id: row.zone_id ?? null,
    code: row.code ?? "UNASSIGNED",
    bin: row.bin ?? null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    location_type: row.location_type ?? "storage",
    is_active: Boolean(row.is_active ?? true),
    zone_code: zone?.code ?? null,
    zone_name: zone?.name ?? null,
    on_hand: inventory.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    reserved: inventory.reduce((sum, item) => sum + Number(item.reserved_quantity ?? 0), 0),
  };
}

function normalizeInventoryRow(row: InventoryRow) {
  return {
    ...row,
    products: (pickOne(row.products) ?? {}) as { id?: string | null; name?: string | null; sku?: string | null; barcode?: string | null },
    locations: (pickOne(row.locations) ?? null) as LocationRow | null,
  };
}

function isShippingAnchor(location: NormalizedLocation) {
  return SHIPPING_TERMS.test(location.location_type) || SHIPPING_TERMS.test(location.zone_code ?? "") || SHIPPING_TERMS.test(location.zone_name ?? "") || SHIPPING_TERMS.test(location.code);
}

function isStorageCandidate(location: NormalizedLocation) {
  return location.is_active && !SHIPPING_TERMS.test(location.location_type) && !SHIPPING_TERMS.test(location.zone_code ?? "") && !SHIPPING_TERMS.test(location.zone_name ?? "");
}

function codeWeight(input: string | null | undefined) {
  const value = (input ?? "").trim();
  const match = value.match(LOCATION_PARTS);
  if (!match) {
    return { alpha: 0, numeric: 0 };
  }

  const letters = (match[1] ?? "").toUpperCase();
  const alpha = letters.split("").reduce((sum, char) => sum * 26 + (char.charCodeAt(0) - 64), 0);
  const numeric = Number(match[2] ?? 0);
  return { alpha, numeric };
}

function travelDistanceBetween(from: NormalizedLocation, to: NormalizedLocation) {
  const fromZone = codeWeight(from.zone_code ?? from.zone_name ?? from.code);
  const toZone = codeWeight(to.zone_code ?? to.zone_name ?? to.code);
  const fromCode = codeWeight(from.code || from.bin);
  const toCode = codeWeight(to.code || to.bin);

  const zoneDistance = Math.abs(fromZone.alpha - toZone.alpha) * 6 + Math.abs(fromZone.numeric - toZone.numeric) * 2;
  const codeDistance = Math.abs(fromCode.alpha - toCode.alpha) * 3 + Math.abs(fromCode.numeric - toCode.numeric);

  return Math.max(1, zoneDistance + codeDistance + 1);
}

function nearestAnchorDistance(location: NormalizedLocation, anchors: NormalizedLocation[]) {
  if (!anchors.length) {
    return 1;
  }

  return anchors.reduce((best, anchor) => Math.min(best, travelDistanceBetween(location, anchor)), Number.POSITIVE_INFINITY);
}

function buildReason(pickFrequency: number, currentDistance: number, recommendedDistance: number) {
  if (pickFrequency >= 5 && currentDistance - recommendedDistance >= 4) {
    return "High pick frequency far from shipping zone";
  }

  if (pickFrequency >= 3) {
    return "Frequently picked item can reduce travel time from a closer slot";
  }

  return "Re-slotting lowers travel distance for recent picking activity";
}

function clampRecommendations(rows: SlottingRecommendation[], limit: number) {
  return rows
    .sort((a, b) => b.optimization_score - a.optimization_score || b.pick_frequency - a.pick_frequency || a.recommended_distance - b.recommended_distance)
    .slice(0, limit);
}

async function fetchSlottingInputs(client: AppSupabaseClient, sinceIso: string) {
  const [locationResult, inventoryResult, orderResult] = await Promise.all([
    client
      .from("locations")
      .select("id, warehouse_id, zone_id, code, bin, capacity, location_type, is_active, zones ( id, code, name ), inventory ( id, quantity, reserved_quantity )")
      .eq("is_active", true)
      .order("code", { ascending: true }),
    client
      .from("inventory")
      .select("id, product_id, location_id, warehouse_id, lot_id, quantity, reserved_quantity, status, products ( id, name, sku, barcode ), locations ( id, warehouse_id, zone_id, code, bin, capacity, location_type, is_active, zones ( id, code, name ) )")
      .gt("quantity", 0)
      .order("updated_at", { ascending: false }),
    client
      .from("orders")
      .select("id, status, created_at, updated_at, pickings ( completed_at, status ), order_items ( product_id, picked_quantity )")
      .gte("created_at", sinceIso),
  ]);

  throwIfError(locationResult.error, "Failed to fetch slotting locations.");
  throwIfError(inventoryResult.error, "Failed to fetch slotting inventory.");
  throwIfError(orderResult.error, "Failed to fetch slotting order history.");

  return {
    locations: (locationResult.data ?? []).map(normalizeLocation),
    inventory: (inventoryResult.data ?? []).map(normalizeInventoryRow),
    orders: (orderResult.data ?? []) as OrderRow[],
  };
}

function buildPickFrequency(orders: OrderRow[], sinceTime: number) {
  const counts = new Map<string, number>();

  for (const order of orders) {
    const completedAt = (order.pickings ?? []).find((picking) => picking.completed_at)?.completed_at ?? null;
    const activityAt = completedAt ?? order.updated_at ?? order.created_at;
    const activityTime = activityAt ? new Date(activityAt).getTime() : 0;
    if (!activityTime || activityTime < sinceTime) {
      continue;
    }

    if (!completedAt && !["picked", "packed", "shipped"].includes(order.status ?? "")) {
      continue;
    }

    for (const item of order.order_items ?? []) {
      if (!item.product_id || Number(item.picked_quantity ?? 0) <= 0) {
        continue;
      }

      counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
    }
  }

  return counts;
}

function groupInventoryRows(rows: InventoryRow[], locationMap: Map<string, NormalizedLocation>) {
  const grouped = new Map<string, GroupedInventory>();

  for (const row of rows) {
    if (!row.product_id || !row.location_id) {
      continue;
    }

    const location = locationMap.get(row.location_id);
    if (!location) {
      continue;
    }

    const product = pickOne(row.products) ?? {};
    const key = `${row.product_id}:${row.location_id}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.quantity += Number(row.quantity ?? 0);
      existing.reserved_quantity += Number(row.reserved_quantity ?? 0);
      existing.inventory_ids.push(row.id);
      continue;
    }

    grouped.set(key, {
      product_id: row.product_id,
      location_id: row.location_id,
      warehouse_id: row.warehouse_id ?? location.warehouse_id,
      quantity: Number(row.quantity ?? 0),
      reserved_quantity: Number(row.reserved_quantity ?? 0),
      inventory_ids: [row.id],
      product_name: String((product as { name?: string | null }).name ?? "Unknown product"),
      product_sku: String((product as { sku?: string | null }).sku ?? "NO-SKU"),
      product_barcode: (product as { barcode?: string | null }).barcode ?? null,
      location,
    });
  }

  return [...grouped.values()];
}

function chooseRecommendedLocation(current: GroupedInventory, candidates: NormalizedLocation[], anchors: NormalizedLocation[]) {
  const currentDistance = nearestAnchorDistance(current.location, anchors);
  const availableCandidates = candidates
    .filter((candidate) => candidate.id !== current.location_id)
    .filter((candidate) => {
      if (candidate.capacity == null || candidate.capacity <= 0) {
        return true;
      }

      const availableCapacity = candidate.capacity - candidate.on_hand;
      return availableCapacity >= current.quantity;
    });

  const searchPool = availableCandidates.length ? availableCandidates : candidates.filter((candidate) => candidate.id !== current.location_id);
  if (!searchPool.length) {
    return null;
  }

  let bestLocation: NormalizedLocation | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of searchPool) {
    const candidateDistance = nearestAnchorDistance(candidate, anchors);
    if (candidateDistance < bestDistance) {
      bestLocation = candidate;
      bestDistance = candidateDistance;
    }
  }

  if (!bestLocation || bestDistance >= currentDistance) {
    return null;
  }

  return {
    bestLocation,
    currentDistance,
    recommendedDistance: bestDistance,
  };
}

async function persistRecommendations(client: AppSupabaseClient, recommendations: SlottingRecommendation[]) {
  const { error: clearError } = await client.from("slotting_recommendations").delete().gte("created_at", "1970-01-01T00:00:00.000Z");
  throwIfError(clearError, "Failed to clear previous slotting recommendations.");

  if (!recommendations.length) {
    return recommendations;
  }

  const payload = recommendations.map((recommendation) => ({
    product_id: recommendation.product_id,
    current_location_id: recommendation.current_location_id,
    recommended_location_id: recommendation.recommended_location_id,
    optimization_score: recommendation.optimization_score,
    reason: recommendation.reason,
  }));

  const { data, error } = await client.from("slotting_recommendations").insert(payload).select("id");
  throwIfError(error, "Failed to persist slotting recommendations.");

  return recommendations.map((recommendation, index) => ({
    ...recommendation,
    id: data?.[index]?.id,
  }));
}

export async function generateSlottingRecommendations(
  client: AppSupabaseClient,
  options: { limit?: number; persist?: boolean } = {},
) {
  const limit = options.limit ?? 25;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const sinceIso = sinceDate.toISOString();
  const sinceTime = sinceDate.getTime();

  const { locations, inventory, orders } = await fetchSlottingInputs(client, sinceIso);
  const locationMap = new Map(locations.map((location) => [location.id, location]));
  const pickFrequency = buildPickFrequency(orders, sinceTime);
  const inventoryGroups = groupInventoryRows(inventory, locationMap);

  const warehouseLocations = new Map<string, NormalizedLocation[]>();
  for (const location of locations) {
    const key = location.warehouse_id ?? "default";
    const rows = warehouseLocations.get(key) ?? [];
    rows.push(location);
    warehouseLocations.set(key, rows);
  }

  const recommendations: SlottingRecommendation[] = [];

  for (const row of inventoryGroups) {
    const frequency = pickFrequency.get(row.product_id) ?? 0;
    if (frequency <= 0) {
      continue;
    }

    const warehouseKey = row.warehouse_id ?? row.location.warehouse_id ?? "default";
    const scopedLocations = warehouseLocations.get(warehouseKey) ?? [];
    if (!scopedLocations.length) {
      continue;
    }

    const anchors = scopedLocations.filter(isShippingAnchor);
    const fallbackAnchor = scopedLocations[0];
    const candidateAnchors = anchors.length ? anchors : fallbackAnchor ? [fallbackAnchor] : [];
    const candidates = scopedLocations.filter(isStorageCandidate);
    const candidatePool = candidates.length ? candidates : scopedLocations.filter((location) => location.is_active);

    const recommendation = chooseRecommendedLocation(row, candidatePool, candidateAnchors);
    if (!recommendation) {
      continue;
    }

    const optimizationScore = Number((frequency / Math.max(recommendation.currentDistance, 1)).toFixed(2));
    recommendations.push({
      product_id: row.product_id,
      product_name: row.product_name,
      product_sku: row.product_sku,
      current_location_id: row.location_id,
      current_location_code: row.location.code,
      recommended_location_id: recommendation.bestLocation.id,
      recommended_location_code: recommendation.bestLocation.code,
      optimization_score: optimizationScore,
      pick_frequency: frequency,
      travel_distance: recommendation.currentDistance,
      recommended_distance: recommendation.recommendedDistance,
      reason: buildReason(frequency, recommendation.currentDistance, recommendation.recommendedDistance),
    });
  }

  const ranked = clampRecommendations(recommendations, limit);
  return options.persist ? persistRecommendations(client, ranked) : ranked;
}

export async function applySlottingRecommendation(client: AppSupabaseClient, recommendationId: string) {
  const { data: recommendation, error: recommendationError } = await client
    .from("slotting_recommendations")
    .select("id, product_id, current_location_id, recommended_location_id")
    .eq("id", recommendationId)
    .single();
  throwIfError(recommendationError, "Failed to fetch slotting recommendation.");

  if (!recommendation) {
    throw new ApiError(404, "Slotting recommendation not found.");
  }

  const { data: sourceRows, error: sourceError } = await client
    .from("inventory")
    .select("*")
    .eq("product_id", recommendation.product_id)
    .eq("location_id", recommendation.current_location_id)
    .gt("quantity", 0);
  throwIfError(sourceError, "Failed to fetch inventory rows for slotting application.");

  if (!sourceRows?.length) {
    throw new ApiError(400, "No inventory rows available to move for this recommendation.");
  }

  for (const row of sourceRows) {
    let targetQuery = client
      .from("inventory")
      .select("*")
      .eq("product_id", row.product_id)
      .eq("location_id", recommendation.recommended_location_id)
      .eq("status", row.status ?? "available");

    targetQuery = row.lot_id ? targetQuery.eq("lot_id", row.lot_id) : targetQuery.is("lot_id", null);

    const { data: targetRow, error: targetError } = await targetQuery.maybeSingle();
    throwIfError(targetError, "Failed to inspect target inventory row.");

    if (targetRow) {
      const { error: updateTargetError } = await client
        .from("inventory")
        .update({
          quantity: Number(targetRow.quantity ?? 0) + Number(row.quantity ?? 0),
          reserved_quantity: Number(targetRow.reserved_quantity ?? 0) + Number(row.reserved_quantity ?? 0),
        })
        .eq("id", targetRow.id);
      throwIfError(updateTargetError, "Failed to merge inventory into recommended location.");

      const { error: deleteSourceError } = await client.from("inventory").delete().eq("id", row.id);
      throwIfError(deleteSourceError, "Failed to clear source inventory row after applying slotting recommendation.");
      continue;
    }

    const { error: moveError } = await client
      .from("inventory")
      .update({ location_id: recommendation.recommended_location_id })
      .eq("id", row.id);
    throwIfError(moveError, "Failed to move inventory to the recommended location.");
  }

  const { error: deleteRecommendationError } = await client.from("slotting_recommendations").delete().eq("id", recommendationId);
  throwIfError(deleteRecommendationError, "Failed to retire applied slotting recommendation.");

  return {
    recommendation_id: recommendation.id,
    product_id: recommendation.product_id,
    moved_rows: sourceRows.length,
    current_location_id: recommendation.current_location_id,
    recommended_location_id: recommendation.recommended_location_id,
  };
}
