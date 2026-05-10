"use client";

import { useCallback } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createEmbeddedCheckoutSession } from "@/lib/actions";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    _stripePromise = loadStripe(key);
  }
  return _stripePromise;
}

export function CheckoutForm({ priceId }: { priceId: string }) {
  const fetchClientSecret = useCallback(async () => {
    try {
      const { clientSecret } = await createEmbeddedCheckoutSession(priceId);
      return clientSecret;
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      throw err;
    }
  }, [priceId]);

  const options = { fetchClientSecret };

  return (
    <EmbeddedCheckoutProvider stripe={getStripePromise()} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
