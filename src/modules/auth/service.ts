import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name?: string;
  role?: string;
};

export async function loginWithPassword(payload: LoginPayload) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function registerUser(payload: RegisterPayload) {
  const admin = createAdminSupabaseClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      name: payload.name,
      role: payload.role ?? "worker",
    },
  });

  if (createError) {
    throw new Error(createError.message);
  }

  const signInResult = await loginWithPassword({
    email: payload.email,
    password: payload.password,
  });

  return {
    user: signInResult.user ?? created.user,
    session: signInResult.session,
  };
}

export async function logoutCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return { signedOut: true };
}