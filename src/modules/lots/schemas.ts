import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listLotsQuerySchema = paginationQuerySchema.extend({
  product_id: uuidSchema.optional(),
});

export const createLotSchema = z.object({
  product_id: uuidSchema,
  lot_number: z.string().trim().nullish(),
  serial_number: z.string().trim().nullish(),
  expiration_date: z.string().trim().nullish(),
  manufactured_at: z.string().trim().nullish(),
});

export const updateLotSchema = createLotSchema.partial();
