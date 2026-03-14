import Link from "next/link";
import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/modules/auth/components/auth-form";
import { loginAction } from "@/modules/auth/actions";
import { getAuthenticatedUser } from "@/modules/auth/session";

export default async function LoginPage() {
  const session = await getAuthenticatedUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="theme-auth-login-shell relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle className="theme-toggle" />
      </div>
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl sm:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Warehouse SaaS</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight">Run inventory, fulfillment, and shipment operations from one control plane.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Sign in to monitor stock, release work, manage warehouse teams, and keep customer orders moving through receiving, picking, packing, and shipping.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold">99.2%</p>
              <p className="mt-2 text-sm text-slate-300">Inventory accuracy target across active warehouses.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold">1.8x</p>
              <p className="mt-2 text-sm text-slate-300">Faster wave execution with structured pick and ship workflows.</p>
            </div>
          </div>
        </section>

        <Card className="border-white/70 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your warehouse account credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AuthForm action={loginAction} mode="login" />
            <p className="text-sm text-slate-500">
              New to the platform?{" "}
              <Link href="/register" className="font-medium text-amber-700 hover:text-amber-600">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
