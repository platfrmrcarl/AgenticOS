export interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
}

export const FALLBACK_PLANS: StripePlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    interval: "month",
    features: [
      "5 automated workflows",
      "Basic reporting",
      "Email support",
      "1 integration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    interval: "month",
    features: [
      "Unlimited workflows",
      "Advanced analytics",
      "Priority support",
      "All integrations",
      "Custom scheduling",
    ],
  },
  {
    id: "enterprise",
    name: "Scale",
    price: 399,
    interval: "month",
    description: "For teams and enterprises running complex agentic operations",
    features: [
      "Everything in Pro",
      "Multi-agent orchestration",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated success manager",
    ],
  },
];
