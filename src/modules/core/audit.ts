import type { SupabaseClient } from "@supabase/supabase-js";

import { createRecord } from "@/modules/core/repository";

type AuditClient = SupabaseClient<any, "public", any>;

type AuditPayload = {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  performed_by?: string | null;
  metadata?: Record<string, unknown>;
};

type AuditOptions = {
  client?: AuditClient;
};

async function resolvePerformedBy(client?: AuditClient) {
  if (!client) {
    return null;
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  return user?.id ?? null;
}

export async function writeAuditLog(payload: AuditPayload, options: AuditOptions = {}) {
  return createRecord("audits", {
    action: payload.action,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id ?? null,
    performed_by: payload.performed_by ?? (await resolvePerformedBy(options.client)),
    metadata: payload.metadata ?? {},
  });
}

export async function writeAuditLogSafe(payload: AuditPayload, options: AuditOptions = {}) {
  try {
    return await writeAuditLog(payload, options);
  } catch (error) {
    console.error("Audit log write failed", {
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id ?? null,
      error,
    });

    return null;
  }
}
