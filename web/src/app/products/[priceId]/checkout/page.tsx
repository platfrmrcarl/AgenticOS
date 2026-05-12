import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ priceId: string }>;
}) {
  const { priceId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/products/${priceId}/checkout`);
  }

  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  const product = price.product as { name: string; metadata?: Record<string, string> };

  if (product?.metadata?.product !== "agentic") {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Product not available</h1>
          <p className="text-muted-foreground mb-6">
            This product is not part of the Agentic Operations catalog.
          </p>
          <Link href="/products" className="text-primary hover:underline">
            Back to products
          </Link>
        </div>
      </main>
    );
  }

  const amount = (price.unit_amount ?? 0) / 100;
  const currency = (price.currency ?? "usd").toUpperCase();
  const interval = price.recurring?.interval ?? "month";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          Agentic Operations
        </Link>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          ← Products
        </Link>
      </nav>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Subscribe to {product.name}</h1>
        <div className="text-muted-foreground mb-8">
          <span className="text-2xl text-foreground font-semibold">${amount}</span>{" "}
          {currency} / {interval}
        </div>

        <div className="bg-background border border-border rounded-2xl p-6">
          <CheckoutForm priceId={priceId} />
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Payments are processed securely by Stripe. You can cancel anytime from your dashboard.
        </p>
      </section>
    </main>
  );
}
