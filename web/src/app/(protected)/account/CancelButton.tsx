"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "@/lib/actions";

export function CancelButton() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Cancel subscription
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Are you sure? This ends your subscription immediately.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Keep subscription
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await cancelSubscription();
                router.refresh();
                setConfirming(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not cancel subscription");
              }
            });
          }}
        >
          {pending ? "Cancelling..." : "Yes, cancel"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-400 font-mono">{error}</p>}
    </div>
  );
}
