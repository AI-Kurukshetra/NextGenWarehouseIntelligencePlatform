import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listReceivingQuerySchema = paginationQuerySchema.extend({
  vendor_id: uuidSchema.optional(),
  status: z.string().trim().optional(),
});

export const createReceiptSchema = z.object({
  vendor_id: uuidSchema.nullish(),
  warehouse_id: uuidSchema.nullish(),
  client_id: uuidSchema.nullish(),
  status: z.string().trim().min(1).default("draft"),
  receipt_number: z.string().trim().nullish(),
  expected_at: z.string().trim().nullish(),
  received_at: z.string().trim().nullish(),
});

export const updateReceiptSchema = createReceiptSchema.partial();

export const confirmReceiptSchema = z.object({
  receipt_id: uuidSchema,
});
