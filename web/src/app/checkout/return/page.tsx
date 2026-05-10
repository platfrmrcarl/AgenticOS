import Link from "next/link";
import { getStripe } from "@/lib/stripe";

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground">Invalid session</h1>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Return home
        </Link>
      </main>
    );
  }

  let paymentStatus: string | null = null;
  try {
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
    paymentStatus = stripeSession.payment_status;
  } catch {
    paymentStatus = null;
  }

  if (!paymentStatus || paymentStatus === "unpaid") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground">Payment not confirmed</h1>
        <p className="text-muted-foreground mt-2">Please try again or contact support.</p>
        <Link href="/" className="mt-4 text-primary hover:underline">Return home</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          You&apos;re all set!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your subscription is active. Start automating your business today.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
