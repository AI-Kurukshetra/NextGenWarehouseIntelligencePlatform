import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import { getAuditPageData } from "@/modules/audits/service";

function formatMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || !Object.keys(metadata).length) {
    return "-";
  }

  return Object.entries(metadata)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" | ");
}

export default async function AuditPage() {
  let auditData: Awaited<ReturnType<typeof getAuditPageData>> | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    auditData = await getAuditPageData(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load audit logs.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Audit Trail</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Warehouse activity tracking</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Review who changed inventory, orders, receipts, pickings, shipments, and workflow state across the warehouse platform.
        </p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total audit events</CardDescription><CardTitle className="text-3xl">{formatNumber(auditData?.summary.total ?? 0)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active actors</CardDescription><CardTitle className="text-3xl">{formatNumber(auditData?.summary.actors ?? 0)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Entity types tracked</CardDescription><CardTitle className="text-3xl">{formatNumber(auditData?.summary.entityTypes ?? 0)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Events in last 24h</CardDescription><CardTitle className="text-3xl">{formatNumber(auditData?.summary.last24Hours ?? 0)}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Audit log stream</CardTitle>
          <CardDescription>Latest tracked activity across the warehouse application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.rows.length ? (
                  auditData.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-950">{row.action}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-950">{row.entity_type ?? "system"}</p>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{row.entity_id ?? "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-950">{row.users?.name ?? row.users?.email ?? "System"}</p>
                          <p className="text-xs text-slate-500">{row.users?.role ?? "service"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[360px] text-sm text-slate-500">{formatMetadata(row.metadata)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatDate(String(row.created_at))}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No audit events found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
