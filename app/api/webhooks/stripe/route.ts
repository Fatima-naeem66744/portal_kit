import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripebilling/stripe";
import { db } from "@/database/index";
import { stripeWebhookEvent, organizationBilling } from "@/database/schema";
import { eq } from "drizzle-orm";
import type { PlanName } from "@/lib/plan";


export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function priceIdToPlan(priceId: string | null): PlanName {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return "business";
  return "free";
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const stripe = getStripe();

  // Stripe requires the RAW body for signature verification.
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip events we already processed (Stripe can redeliver).
  try {
    await db.insert(stripeWebhookEvent).values({
      id: event.id,
      type: event.type,
    });
  } catch {
    // Duplicate event id — already processed, ignore.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan as PlanName | undefined;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (organizationId && plan && customerId) {
          let currentPeriodEnd: Date | null = null;
          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            currentPeriodEnd = new Date(
              (sub as any).data.current_period_end * 1000,
            );
          }

          await db
            .insert(organizationBilling)
            .values({
              id: crypto.randomUUID(),
              organizationId,
              plan,
              status: "active",
              provider: "stripe",
              customerId,
              subscriptionId: subscriptionId ?? undefined,
              currentPeriodEnd,
            })
            .onConflictDoUpdate({
              target: organizationBilling.organizationId,
              set: {
                plan,
                status: "active",
                provider: "stripe",
                customerId,
                subscriptionId: subscriptionId ?? undefined,
                currentPeriodEnd,
                updatedAt: new Date(),
              },
            });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const plan = priceIdToPlan(
          subscription.items.data[0]?.price.id ?? null,
        );
        const status = subscription.status as string;
        const currentPeriodEnd = new Date(
          subscription.current_period_end * 1000,
        );

        await db
          .update(organizationBilling)
          .set({
            plan,
            status,
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(organizationBilling.customerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await db
          .update(organizationBilling)
          .set({
            plan: "free",
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(organizationBilling.customerId, customerId));
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        await db
          .update(organizationBilling)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(organizationBilling.customerId, customerId));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        await db
          .update(organizationBilling)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(organizationBilling.customerId, customerId));
        break;
      }

      default:
        // Unhandled event type — still acknowledge receipt.
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
