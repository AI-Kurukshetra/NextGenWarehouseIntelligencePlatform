import { cleanPayload, getRouteParam, parsePagination, readJson } from "@/lib/api/route-helpers";
import { ok } from "@/lib/api/responses";
import { writeAuditLog } from "@/modules/core/audit";
import { resourceConfigs, type ResourceConfig } from "@/modules/core/resource-config";
import {
  createRecord,
  deleteRecord,
  getRecordById,
  listRecords,
  updateRecord,
} from "@/modules/core/repository";

export function getResourceConfig(resource: keyof typeof resourceConfigs) {
  return resourceConfigs[resource];
}

export function createCollectionHandlers(resource: ResourceConfig) {
  return {
    GET: async (request: Request) => {
      const pagination = parsePagination(request);
      const result = await listRecords(resource.table, {
        ...pagination,
        searchColumn: resource.searchColumn,
      });

      return ok({
        resource: resource.resource,
        ...result,
      });
    },
    POST: async (request: Request) => {
      const payload = cleanPayload(await readJson<Record<string, unknown>>(request));
      const created = await createRecord(resource.table, payload);

      await writeAuditLog({
        action: `${resource.resource}.created`,
        entity_type: resource.table,
        entity_id: String(created.id ?? ""),
        metadata: payload,
      });

      return ok(
        {
          resource: resource.resource,
          row: created,
        },
        { status: 201 },
      );
    },
  };
}

export function createItemHandlers(resource: ResourceConfig) {
  return {
    GET: async (_request: Request, context: { params?: Promise<Record<string, string | string[] | undefined>> }) => {
      const id = await getRouteParam(context, "id");
      const row = await getRecordById(resource.table, id);

      return ok({
        resource: resource.resource,
        row,
      });
    },
    PATCH: async (request: Request, context: { params?: Promise<Record<string, string | string[] | undefined>> }) => {
      const id = await getRouteParam(context, "id");
      const payload = cleanPayload(await readJson<Record<string, unknown>>(request));
      const row = await updateRecord(resource.table, id, payload);

      await writeAuditLog({
        action: `${resource.resource}.updated`,
        entity_type: resource.table,
        entity_id: id,
        metadata: payload,
      });

      return ok({
        resource: resource.resource,
        row,
      });
    },
    DELETE: async (_request: Request, context: { params?: Promise<Record<string, string | string[] | undefined>> }) => {
      const id = await getRouteParam(context, "id");
      const row = await deleteRecord(resource.table, id);

      await writeAuditLog({
        action: `${resource.resource}.deleted`,
        entity_type: resource.table,
        entity_id: id,
      });

      return ok({
        resource: resource.resource,
        row,
      });
    },
  };
}
