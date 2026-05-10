import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ priceId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const { priceId } = await searchParams;
  if (!priceId) redirect("/");

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          Complete Your Subscription
        </h1>
        <CheckoutForm priceId={priceId} />
      </div>
    </main>
  );
}
