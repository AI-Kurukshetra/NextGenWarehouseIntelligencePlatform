import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listProductsQuerySchema = paginationQuerySchema;

export const createProductSchema = z.object({
  client_id: uuidSchema.nullish(),
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  barcode: z.string().trim().min(1).nullish(),
  description: z.string().trim().nullish(),
  unit_of_measure: z.string().trim().min(1).default("each"),
  is_active: z.coerce.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();
