import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listLocationsQuerySchema = paginationQuerySchema.extend({
  warehouse_id: uuidSchema.optional(),
  zone_id: uuidSchema.optional(),
});

export const createLocationSchema = z.object({
  warehouse_id: uuidSchema,
  zone_id: uuidSchema.nullish(),
  code: z.string().trim().min(1),
  bin: z.string().trim().nullish(),
  capacity: z.coerce.number().int().positive().nullish(),
  location_type: z.string().trim().min(1).default("storage"),
  is_active: z.coerce.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema.partial();
