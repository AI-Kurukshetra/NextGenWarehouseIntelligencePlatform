import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listPickingQuerySchema = paginationQuerySchema.extend({
  order_id: uuidSchema.optional(),
  worker_id: uuidSchema.optional(),
  status: z.string().trim().optional(),
});

export const createPickingSchema = z.object({
  order_id: uuidSchema,
  worker_id: uuidSchema.nullish(),
  status: z.string().trim().min(1).default("pending"),
  route_code: z.string().trim().nullish(),
  started_at: z.string().trim().nullish(),
  completed_at: z.string().trim().nullish(),
});

export const confirmPickingSchema = z.object({
  picking_id: uuidSchema,
});
