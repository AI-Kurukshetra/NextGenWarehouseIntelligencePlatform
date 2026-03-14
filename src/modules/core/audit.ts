import { createRecord } from "@/modules/core/repository";

type AuditPayload = {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  performed_by?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(payload: AuditPayload) {
  return createRecord("audits", {
    action: payload.action,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id ?? null,
    performed_by: payload.performed_by ?? null,
    metadata: payload.metadata ?? {},
  });
}
