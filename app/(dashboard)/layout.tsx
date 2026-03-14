import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedUser } from "@/modules/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthenticatedUser();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.profile?.name ?? session.user.user_metadata.name ?? session.user.email?.split("@")[0] ?? "Warehouse User",
    email: session.profile?.email ?? session.user.email ?? "",
    role: session.profile?.role ?? String(session.user.user_metadata.role ?? "worker"),
  };

  return <AppShell user={user}>{children}</AppShell>;
}

