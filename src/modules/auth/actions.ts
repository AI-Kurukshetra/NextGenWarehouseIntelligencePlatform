"use server";

import { redirect } from "next/navigation";

import { loginWithPassword, logoutCurrentUser, registerUser } from "@/modules/auth/service";
import { loginSchema, registerSchema, type AuthActionState } from "@/modules/auth/schemas";

function validationState(error: { flatten: () => { fieldErrors: Record<string, string[]> } }, message: string): AuthActionState {
  return {
    success: false,
    message,
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return validationState(parsed.error, "Fix the highlighted fields and try again.");
  }

  try {
    await loginWithPassword(parsed.data);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }

  redirect("/dashboard");
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "worker",
  });

  if (!parsed.success) {
    return validationState(parsed.error, "Fix the highlighted fields and try again.");
  }

  try {
    const result = await registerUser(parsed.data);
    if (!result.session) {
      return {
        success: true,
        message: "Account created. Check your email to confirm the account before signing in.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to create the account.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await logoutCurrentUser();
  redirect("/login");
}

