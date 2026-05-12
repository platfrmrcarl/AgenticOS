export interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
}

export const PLAN_NAMES = ["Essential", "Premium", "Enterprise"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];
