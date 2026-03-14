"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthActionState } from "@/modules/auth/schemas";

const initialState: AuthActionState = { success: false };

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "login" | "register";
};

function SubmitButton({ label }: { label: string }) {
  return <Button type="submit" className="h-11 w-full rounded-xl bg-amber-600 text-white hover:bg-amber-500">{label}</Button>;
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Full name
          </label>
          <Input id="name" name="name" placeholder="Avery Johnson" />
          {state.fieldErrors?.name ? <p className="text-sm text-rose-600">{state.fieldErrors.name[0]}</p> : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="team@warehouse.com" />
        {state.fieldErrors?.email ? <p className="text-sm text-rose-600">{state.fieldErrors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="Enter your password" />
        {state.fieldErrors?.password ? <p className="text-sm text-rose-600">{state.fieldErrors.password[0]}</p> : null}
      </div>

      {mode === "register" ? <input name="role" type="hidden" value="worker" /> : null}

      {state.message ? (
        <Alert variant={state.success ? "default" : "destructive"}>{state.message}</Alert>
      ) : null}

      <SubmitButton label={isPending ? "Working..." : mode === "login" ? "Sign in" : "Create account"} />
    </form>
  );
}
