import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().default(""),
});

export const idParamsSchema = z.object({
  id: uuidSchema,
});
