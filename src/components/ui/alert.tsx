import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "theme-alert-default border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
