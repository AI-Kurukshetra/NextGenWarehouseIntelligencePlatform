"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/modules/auth/actions";
import { sidebarNavigation } from "@/modules/navigation/config";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

type NavIconProps = {
  href: string;
  active: boolean;
};

function itemMonogram(label: string) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  return segment
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function SidebarIcon({ href, active }: NavIconProps) {
  const tone = active ? "text-white" : "text-slate-200";
  const stroke = active ? "1.9" : "1.75";

  switch (href) {
    case "/dashboard":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M4 13.5h7V20H4zM13 4h7v9h-7zM13 15h7v5h-7zM4 4h7v7H4z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/inventory":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/orders":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M7 4h10l3 3v13H4V4h3Zm0 0v4h10V4M8 12h8M8 16h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/receiving":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/picking":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M4 7h7v7H4zM13 4h7v7h-7zM13 13h7v7h-7zM8 10h5M16.5 11v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/shipping":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M3 7h11v9H3zM14 10h3l4 3v3h-7zM7 18.5a1.5 1.5 0 1 1 0 .01ZM18 18.5a1.5 1.5 0 1 1 0 .01Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/optimization":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M5 17.5 10 12l3 3 6-7M5 6h14M5 20h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );    case "/inventory/locations":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M12 20s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Zm0-8.5a2.5 2.5 0 1 0 0-.01Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/cycle-counts":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M9 7h11M9 12h11M9 17h11M4 7h.01M4 12h.01M4 17h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/returns":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M9 10 5 14l4 4M5 14h8a6 6 0 1 0 0-12h-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    case "/settings":
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7 3.5-.8-.5.1-.9-1.7-2.9-.9.3-.7-.6-.2-1H11l-.2 1-.7.6-.9-.3-1.7 2.9.1.9-.8.5v3l.8.5-.1.9 1.7 2.9.9-.3.7.6.2 1h3.6l.2-1 .7-.6.9.3 1.7-2.9-.1-.9.8-.5v-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" className={cn("h-5 w-5", tone)} fill="none" viewBox="0 0 24 24">
          <path d="M5 12h14M12 5v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} />
        </svg>
      );
  }
}

function ChevronToggle({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      {open ? (
        <path d="m14.5 6.5-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ) : (
        <path d="m9.5 6.5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M14 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="theme-shell-bg min-h-screen text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-start">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 border-r border-slate-800 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-slate-100 transition-[width,transform] duration-300 ease-out lg:sticky lg:top-4 lg:z-20 lg:ml-4 lg:mt-4 lg:h-[calc(100vh-2rem)] lg:rounded-[1.5rem] lg:border",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            sidebarOpen ? "w-80" : "w-[104px]",
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.03))] lg:rounded-[1.5rem]" />
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="absolute -right-3 top-8 z-30 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-100 shadow-[0_12px_30px_rgba(2,6,23,0.45)] transition hover:scale-105 hover:bg-slate-900 lg:inline-flex"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronToggle open={sidebarOpen} />
          </button>

          <div className="relative flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-800 px-4 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-slate-800 bg-slate-900/80 px-3 py-2.5 transition-colors duration-200 hover:bg-slate-900",
                    sidebarOpen ? "flex-1" : "flex-1 justify-center",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-amber-500/30 bg-amber-500/15 text-sm font-semibold text-amber-100">
                    W
                  </div>
                  <div
                    className={cn(
                      "min-w-0 overflow-hidden transition-all duration-300",
                      sidebarOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Warehouse SaaS</p>
                    <p className="mt-0.5 truncate text-base font-semibold text-white">NextGen WMS</p>
                  </div>
                </Link>
                <ThemeToggle className="shrink-0" compact={!sidebarOpen} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white transition hover:bg-slate-800 lg:hidden"
                  aria-label="Close sidebar"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sidebarNavigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const collapsed = !sidebarOpen;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-[1rem] border px-3 py-2 text-slate-200 transition-all duration-200",
                      active
                        ? "theme-sidebar-active border-slate-600 bg-slate-100 text-slate-950 shadow-sm"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900",
                      collapsed ? "justify-center px-0" : "",
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border transition-all duration-200",
                        active
                          ? "theme-sidebar-active-icon border-slate-900 bg-slate-950 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-200",
                        collapsed && !active ? "group-hover:-translate-y-0.5 group-hover:border-amber-400/60 group-hover:bg-amber-400/12 group-hover:text-amber-100 group-hover:shadow-[0_10px_24px_rgba(245,158,11,0.22)]" : "",
                      )}
                    >
                      <SidebarIcon href={item.href} active={active} />
                      {collapsed && !active ? <span className="absolute inset-0 rounded-[0.9rem] ring-0 ring-amber-300/40 transition group-hover:ring-1" /> : null}
                    </div>
                    <div
                      className={cn(
                        "min-w-0 overflow-hidden transition-all duration-300",
                        sidebarOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0",
                      )}
                    >
                      <p className={cn("truncate text-[13px] font-semibold", active ? "theme-sidebar-active-copy text-slate-950" : "text-white")}>{item.label}</p>
                      <p className={cn("mt-0.5 text-[11px]", active ? "theme-sidebar-active-muted text-slate-500" : "text-slate-400")}>Open module workspace</p>
                    </div>
                    {!sidebarOpen ? (
                      <div className="pointer-events-none absolute left-[92px] top-1/2 z-30 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-[0_16px_35px_rgba(2,6,23,0.4)] transition-all duration-200 group-hover:translate-x-2 group-hover:opacity-100">
                        {item.label}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 px-4 py-3">
              <div
                className={cn(
                  "rounded-[1rem] border border-slate-800 bg-slate-900/80 p-3",
                  !sidebarOpen ? "px-0 py-2" : "",
                )}
              >
                <div className={cn("flex items-center gap-3", sidebarOpen ? "" : "justify-center") }>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-slate-700 bg-slate-800 text-sm font-semibold text-white">
                    {itemMonogram(user.name)}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 overflow-hidden transition-all duration-300",
                      sidebarOpen ? "max-w-[170px] opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{user.role}</p>
                  </div>
                </div>

                <form action={logoutAction} className={cn(sidebarOpen ? "mt-3" : "mt-2 flex justify-center") }>
                  <Button
                    type="submit"
                    variant="secondary"
                    className={cn(
                      "h-9 border-0 bg-slate-100 text-slate-950 hover:bg-white",
                      sidebarOpen ? "w-full justify-center" : "w-9 px-0"
                    )}
                    aria-label="Logout"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogoutIcon />
                      <span className={cn(sidebarOpen ? "inline" : "hidden")}>Logout</span>
                    </span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col transition-[padding] duration-300 lg:pl-4">
          <div className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Open sidebar"
              >
                <MenuIcon />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{pageTitle(pathname)}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
