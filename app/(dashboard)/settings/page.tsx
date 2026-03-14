import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function SettingsPage() {
  let configurations: Array<any> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.from("configurations").select("id, key, scope, is_secret, updated_at").order("updated_at", { ascending: false }).limit(25);
    configurations = result.data ?? [];
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load settings.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Settings</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Platform settings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Review warehouse and system configuration records stored in Supabase.</p>
      </section>

      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Total configuration keys</CardDescription><CardTitle className="text-3xl">{formatNumber(configurations.length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Secret values</CardDescription><CardTitle className="text-3xl">{formatNumber(configurations.filter((row) => row.is_secret).length)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Scopes</CardDescription><CardTitle className="text-3xl">{formatNumber(new Set(configurations.map((row) => row.scope)).size)}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Configuration registry</CardTitle>
          <CardDescription>Latest settings rows visible to the authenticated user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.length ? (
                  configurations.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-950">{row.key}</TableCell>
                      <TableCell>{row.scope}</TableCell>
                      <TableCell><Badge variant={row.is_secret ? "warning" : "success"}>{row.is_secret ? "yes" : "no"}</Badge></TableCell>
                      <TableCell>{formatDate(row.updated_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No configuration rows found.</TableCell>
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

