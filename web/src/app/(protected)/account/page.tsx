import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

async function getPlanName(priceId: string | null): Promise<string | null> {
  if (!priceId) return null;
  try {
    const price = await getStripe().prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product | null;
    return product?.name ?? null;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      name: true,
      isSubscribed: true,
      subscriptionPlan: true,
      stripeSubscriptionId: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const planName = await getPlanName(user.subscriptionPlan);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your profile and subscription.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Profile
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 space-y-2">
          {user.name && (
            <div className="text-sm">
              <span className="text-muted-foreground">Name: </span>
              <span className="text-foreground">{user.name}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Email: </span>
            <span className="text-foreground">{user.email}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Member since: </span>
            <span className="text-foreground">
              {user.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Subscription
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {user.isSubscribed && user.stripeSubscriptionId ? (
            <>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Plan: </span>
                  <span className="text-foreground font-semibold">
                    {planName ?? "Active"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Status: </span>
                  <span className="text-green-500 font-semibold">Active</span>
                </div>
              </div>
              <CancelButton />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have an active subscription.
              </p>
              <Link href="/products">
                <Button>View plans</Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
