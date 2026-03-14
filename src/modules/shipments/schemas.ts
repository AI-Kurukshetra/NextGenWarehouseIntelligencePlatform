import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listShipmentsQuerySchema = paginationQuerySchema.extend({
  order_id: uuidSchema.optional(),
  carrier_id: uuidSchema.optional(),
});

export const createShipmentSchema = z.object({
  order_id: uuidSchema,
  carrier_id: uuidSchema.nullish(),
  tracking_number: z.string().trim().nullish(),
  status: z.string().trim().min(1).default("pending"),
  shipped_at: z.string().trim().nullish(),
});

export const updateShipmentSchema = createShipmentSchema.partial();
