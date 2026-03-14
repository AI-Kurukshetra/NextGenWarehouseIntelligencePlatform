import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  customer_id: uuidSchema.optional(),
  status: z.string().trim().optional(),
});

const orderItemSchema = z.object({
  product_id: uuidSchema,
  quantity: z.coerce.number().positive(),
});

export const createOrderSchema = z.object({
  client_id: uuidSchema.nullish(),
  customer_id: uuidSchema.nullish(),
  warehouse_id: uuidSchema.nullish(),
  status: z.string().trim().min(1).default("draft"),
  priority: z.string().trim().min(1).default("normal"),
  order_number: z.string().trim().nullish(),
  ordered_at: z.string().trim().nullish(),
  items: z.array(orderItemSchema).default([]),
});

export const updateOrderSchema = createOrderSchema.omit({ items: true }).partial();
