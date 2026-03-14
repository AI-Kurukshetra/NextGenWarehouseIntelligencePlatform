import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

const orderLineSchema = z.object({
  product_id: uuidSchema,
  quantity: z.coerce.number().positive(),
});

export const createWorkflowOrderSchema = z.object({
  client_id: uuidSchema.nullish(),
  customer_id: uuidSchema.nullish(),
  warehouse_id: uuidSchema.nullish(),
  priority: z.string().trim().min(1).default("normal"),
  order_number: z.string().trim().nullish(),
  items: z.array(orderLineSchema).min(1),
});

export const generatePickListSchema = z.object({
  order_id: uuidSchema,
});

export const assignPickerSchema = z.object({
  picking_id: uuidSchema,
  worker_id: uuidSchema,
});

export const packShipmentSchema = z.object({
  order_id: uuidSchema,
  carrier_id: uuidSchema.nullish(),
  tracking_number: z.string().trim().nullish(),
});

export const shipOrderSchema = z.object({
  shipment_id: uuidSchema,
});

export const fulfillmentQuerySchema = paginationQuerySchema.extend({
  status: z.string().trim().optional(),
});
