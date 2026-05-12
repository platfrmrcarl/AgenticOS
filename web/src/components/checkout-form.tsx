"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function InnerForm({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?subscription=${subscriptionId}`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing…" : "Subscribe"}
      </Button>
    </form>
  );
}

export function CheckoutForm({ priceId }: { priceId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!cancelled) setLoadError(body.error ?? `Failed (${res.status})`);
        return;
      }
      const data = await res.json();
      if (!cancelled) {
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [priceId]);

  if (!publishableKey) {
    return (
      <div className="text-sm text-muted-foreground">
        Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable checkout.
      </div>
    );
  }
  if (loadError) {
    return <div className="text-sm text-red-500">{loadError}</div>;
  }
  if (!clientSecret || !subscriptionId) {
    return <div className="text-sm text-muted-foreground">Loading checkout…</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerForm subscriptionId={subscriptionId} />
    </Elements>
  );
}
