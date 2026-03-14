import Link from "next/link";
import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "@/modules/auth/actions";
import { AuthForm } from "@/modules/auth/components/auth-form";
import { getAuthenticatedUser } from "@/modules/auth/session";

export default async function RegisterPage() {
  const session = await getAuthenticatedUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="theme-auth-register-shell relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle className="theme-toggle" />
      </div>
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-white/70 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Register a warehouse operator account for local development and testing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AuthForm action={registerAction} mode="register" />
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-amber-700 hover:text-amber-600">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <section className="theme-auth-side-panel rounded-[2rem] border border-amber-200 p-8 shadow-xl sm:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Platform setup</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Start with authenticated warehouse operations.</h1>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <li>Create a worker account backed by Supabase Auth.</li>
            <li>Access protected dashboard routes with middleware-enforced sessions.</li>
            <li>Use the same account to test inventory, order, receiving, picking, and shipping flows locally.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
