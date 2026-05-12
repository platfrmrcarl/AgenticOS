import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";

interface AgenticProduct {
  priceId: string;
  productId: string;
  name: string;
  description: string | null;
  image: string | null;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

async function getAgenticProducts(): Promise<AgenticProduct[]> {
  try {
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });

    return prices.data
      .filter((price) => {
        const product = price.product as { metadata?: Record<string, string>; active?: boolean };
        return product?.active !== false && product?.metadata?.product === "agentic";
      })
      .map((price) => {
        const product = price.product as {
          id: string;
          name: string;
          description: string | null;
          images?: string[];
          metadata?: Record<string, string>;
        };
        const featuresRaw = product.metadata?.features ?? "";
        const features = featuresRaw
          ? featuresRaw.split(",").map((f) => f.trim()).filter(Boolean)
          : [];
        return {
          priceId: price.id,
          productId: product.id,
          name: product.name,
          description: product.description,
          image: product.images?.[0] ?? null,
          amount: (price.unit_amount ?? 0) / 100,
          currency: (price.currency ?? "usd").toUpperCase(),
          interval: price.recurring?.interval ?? "month",
          features,
        };
      });
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getAgenticProducts();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          Agentic Operations
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-4">Products</h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Live subscriptions from Stripe tagged <code className="text-xs bg-muted px-1.5 py-0.5 rounded">product=agentic</code>.
        </p>

        {products.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">
              No products found. Create a product in Stripe with metadata{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">product=agentic</code>{" "}
              and an active price.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.priceId}
                className="bg-background border border-border rounded-2xl p-6 flex flex-col"
              >
                <h2 className="text-xl font-bold mb-2">{p.name}</h2>
                {p.description && (
                  <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                )}
                <div className="mb-6">
                  <span className="text-3xl font-bold">${p.amount}</span>
                  <span className="text-muted-foreground text-sm">
                    {" "}
                    {p.currency}/{p.interval}
                  </span>
                </div>
                {p.features.length > 0 && (
                  <ul className="space-y-2 mb-6 flex-grow">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/products/${p.priceId}/checkout`} className="mt-auto">
                  <Button className="w-full">Subscribe</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
