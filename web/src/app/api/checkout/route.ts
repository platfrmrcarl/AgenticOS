import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { priceId } = await req.json();
  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json({ error: "priceId required" }, { status: 400 });
  }

  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.email) {
    return NextResponse.json({ error: "User has no email" }, { status: 400 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.confirmation_secret", "latest_invoice.payment_intent"],
    metadata: { userId: user.id, priceId },
  });

  const invoice = subscription.latest_invoice as {
    confirmation_secret?: { client_secret?: string };
    payment_intent?: { client_secret?: string };
  } | null;

  const clientSecret =
    invoice?.confirmation_secret?.client_secret ??
    invoice?.payment_intent?.client_secret;

  if (!clientSecret) {
    return NextResponse.json(
      { error: "Could not obtain client_secret from Stripe" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    subscriptionId: subscription.id,
    clientSecret,
  });
}
