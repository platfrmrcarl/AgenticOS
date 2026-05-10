"use server";

import { auth } from "@/auth";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";

export async function createEmbeddedCheckoutSession(
  priceId: string
): Promise<{ clientSecret: string }> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const authUrl = process.env.AUTH_URL;
  if (!authUrl) throw new Error("AUTH_URL is not configured");

  if (!priceId || !priceId.startsWith("price_")) {
    throw new Error("Invalid price ID");
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page" as const,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${authUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: session.user.email,
  });

  if (!checkoutSession.client_secret)
    throw new Error("No client secret returned from Stripe");

  return { clientSecret: checkoutSession.client_secret };
}

export async function cancelSubscription(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) throw new Error("No active subscription");

  const stripe = getStripe();
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        isSubscribed: false,
        stripeSubscriptionId: null,
        subscriptionPlan: null,
      },
    });
  } catch (err) {
    // Stripe cancel succeeded; DB update failed. Webhook handler will reconcile on next event.
    console.error("Failed to update user after subscription cancel:", err);
  }
}
