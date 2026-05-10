import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Process event
  try {
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode === "subscription" && checkoutSession.customer_email) {
        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id ?? null;
        const planName = checkoutSession.metadata?.plan ?? "pro";
        await prisma.user.update({
          where: { email: checkoutSession.customer_email },
          data: {
            isSubscribed: true,
            subscriptionPlan: planName,
            stripeSubscriptionId: subscriptionId,
          },
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          isSubscribed: false,
          stripeSubscriptionId: null,
          subscriptionPlan: null,
        },
      });
    }

    await prisma.processedWebhookEvent.create({ data: { id: event.id } });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
