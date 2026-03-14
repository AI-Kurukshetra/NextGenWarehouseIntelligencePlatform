import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, warehouse_id, client_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile,
  };
});

