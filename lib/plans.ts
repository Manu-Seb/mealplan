export interface Plan {
  name: string;
  amount: number;
  currency: string;
  interval: string;
  isPopular?: boolean;
  description: string;
  features: string[];
}

export const availablePlans: Plan[] = [
  {
    name: "Weekly Plan",
    amount: 99.99,
    currency: "INR",
    interval: "week",
    description:
      "Great if you want to try the service before comitting longer.",
    features: [
      "Unliited AI meal plans",
      "AI nutrition Insigts",
      "Cancel Anytime",
    ],
  },
  {
    name: "Monthy Plan",
    amount: 399.99,
    currency: "INR",
    interval: "month",
    isPopular: true,
    description:
      "Perfect for Ongoing, Month to month meal planning and features",
    features: [
      "Unliited AI meal plans",
      "Priority AI support",
      "Cancel Anytime",
    ],
  },
  {
    name: "Yearly Plan",
    amount: 2399.99,
    currency: "INR",
    interval: "year",
    description:
      "Great for consistent and long term usage, planning and features",
    features: [
      "Unliited AI meal plans",
      "All premium features",
      "Cancel Anytime",
    ],
  },
];

const priceIDMap: Record<string, string> = {
  week: process.env.STRIPE_PRICE_WEEKLY || "default_weekly_price",
  month: process.env.STRIPE_PRICE_MONTHLY || "default_monthly_price",
  year: process.env.STRIPE_PRICE_YEARLY || "default_yearly_price",
};

export const getPriceIDFromType = (planType: string) => priceIDMap[planType];
