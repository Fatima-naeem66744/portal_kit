// code reference https://docs.stripe.com/api/checkout/sessions/create?utm_source=chatgpt.com
import "server-only";

import { getStripe } from "./stripe";
import type { PlanName } from "@/lib/plan";

type PaidPlan = Exclude<PlanName, "free">;

type CreateCheckoutSessionInput = {
  organizationId: string;
  plan: PaidPlan;
  customerId?: string | null;
};

export async function createCheckoutSession({
  organizationId,
  plan,
  customerId,
}: CreateCheckoutSessionInput) {
  // 1. Get the Stripe Price ID from server environment variables.
  const priceIds: Record<PaidPlan, string | undefined> = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };

  const priceId = priceIds[plan];

  if (!priceId) {
    throw new Error(`Missing Stripe Price ID for ${plan} plan.`);
  }

  // 2. Get our application URL.
  // Stripe must know where to send the user after Checkout.
  const appUrl = (
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  // 3. Create the Checkout Session.
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }
// the code below is taken from their official docs 
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    success_url:
      `${appUrl}/dashboard/billing?checkout=success` +
      `&session_id={CHECKOUT_SESSION_ID}`,

    cancel_url:
      `${appUrl}/dashboard/billing?checkout=cancelled`,

    // Connect this Checkout Session to organization.
    client_reference_id: organizationId,

    metadata: {
      organizationId,
      plan,
    },

    // Also attach the organization information to the subscription.
    subscription_data: {
      metadata: {
        organizationId,
        plan,
      },
    },

    // Reuse an existing Stripe customer if we have one.
    ...(customerId ? { customer: customerId } : {}),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}
