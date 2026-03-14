import { z } from "zod";

import { uuidSchema } from "@/lib/api/schemas";

export const auditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().default(""),
  action: z.string().trim().optional(),
  entity_type: z.string().trim().optional(),
  performed_by: uuidSchema.optional(),
});
