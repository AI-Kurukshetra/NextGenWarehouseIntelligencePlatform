import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth/session";

export default async function HomePage() {
  const session = await getAuthenticatedUser();
  redirect(session ? "/dashboard" : "/login");
}

