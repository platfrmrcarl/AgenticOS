"use client";

import { useCallback } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createEmbeddedCheckoutSession } from "@/lib/actions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function CheckoutForm({ priceId }: { priceId: string }) {
  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await createEmbeddedCheckoutSession(priceId);
    return clientSecret;
  }, [priceId]);

  const options = { fetchClientSecret };

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
