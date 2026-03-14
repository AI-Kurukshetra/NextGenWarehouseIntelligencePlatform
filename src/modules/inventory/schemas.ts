import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listInventoryQuerySchema = paginationQuerySchema.extend({
  product_id: uuidSchema.optional(),
  location_id: uuidSchema.optional(),
  status: z.string().trim().optional(),
});

export const createInventorySchema = z.object({
  client_id: uuidSchema.nullish(),
  warehouse_id: uuidSchema.nullish(),
  product_id: uuidSchema,
  location_id: uuidSchema,
  lot_id: uuidSchema.nullish(),
  quantity: z.coerce.number().min(0),
  reserved_quantity: z.coerce.number().min(0).default(0),
  status: z.string().trim().min(1).default("available"),
});

export const adjustInventorySchema = z.object({
  inventory_id: uuidSchema,
  quantity_delta: z.coerce.number().refine((value) => value !== 0, "quantity_delta must not be zero."),
  reason: z.string().trim().nullish(),
});

export const transferInventorySchema = z.object({
  inventory_id: uuidSchema,
  to_location_id: uuidSchema,
  quantity: z.coerce.number().positive(),
});

export const barcodeSearchQuerySchema = z.object({
  code: z.string().trim().min(1),
});
