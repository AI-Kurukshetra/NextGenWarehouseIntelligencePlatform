"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ApplyRecommendationButtonProps = {
  recommendationId: string;
};

export function ApplyRecommendationButton({ recommendationId }: ApplyRecommendationButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/optimization/slotting/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recommendation_id: recommendationId }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Failed to apply recommendation.");
      }

      router.refresh();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Failed to apply recommendation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleApply} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Applying..." : "Apply Recommendation"}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
