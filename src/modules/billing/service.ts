import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createRecord } from "@/modules/core/repository";
import { writeAuditLog } from "@/modules/core/audit";

type BillingType = "invoice" | "payment";

type BillingPayload = {
  client_id: string;
  amount: number;
  currency?: string;
  status?: string;
  reference?: string;
  due_at?: string;
};

export async function listBillingByType(type: BillingType) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("billing")
    .select("*")
    .eq("billing_type", type)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createBillingEntry(type: BillingType, payload: BillingPayload) {
  const row = await createRecord("billing", {
    client_id: payload.client_id,
    billing_type: type,
    amount: payload.amount,
    currency: payload.currency ?? "USD",
    status: payload.status ?? "pending",
    reference: payload.reference ?? null,
    due_at: payload.due_at ?? null,
  });

  await writeAuditLog({
    action: `billing.${type}.created`,
    entity_type: "billing",
    entity_id: String(row.id),
    metadata: payload,
  });

  return row;
}
