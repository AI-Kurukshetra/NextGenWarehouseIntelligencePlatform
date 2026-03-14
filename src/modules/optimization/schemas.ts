import { z } from "zod";

import { uuidSchema } from "@/lib/api/schemas";

export const slottingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const applySlottingRecommendationSchema = z.object({
  recommendation_id: uuidSchema,
});
