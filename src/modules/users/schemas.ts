import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "@/lib/api/schemas";

export const listUsersQuerySchema = paginationQuerySchema;

export const createUserSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: z.string().trim().min(1).default("worker"),
  warehouse_id: uuidSchema.nullish(),
  client_id: uuidSchema.nullish(),
  status: z.string().trim().min(1).default("active"),
});

export const updateUserSchema = createUserSchema.omit({ id: true }).partial();
