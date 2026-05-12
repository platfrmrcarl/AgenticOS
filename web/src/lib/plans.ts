export interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
}
