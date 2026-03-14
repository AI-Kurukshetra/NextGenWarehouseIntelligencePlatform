import { handleRoute, jsonSuccess, parseQuery } from "@/lib/api/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auditLogsQuerySchema } from "@/modules/audits/schemas";
import { listAuditLogs } from "@/modules/audits/service";

export const GET = handleRoute(async (request) => {
  const query = parseQuery(request, auditLogsQuerySchema);
  const supabase = await createServerSupabaseClient();
  const data = await listAuditLogs(supabase, query);
  return jsonSuccess(data);
});
