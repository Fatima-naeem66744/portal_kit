import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateBillingForOrganization } from "@/lib/billing";
import { PLANS, type PlanName } from "@/lib/plan";
import { upgradePlanAction } from "../action";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripebilling/stripe";
import { db } from "@/database";
import { organizationBilling } from "@/database/schema";

export default async function billingpage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // --- Stripe checkout success verification ---
  if (params.checkout === "success" && params.session_id) {
    try {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        typeof params.session_id === "string"
          ? params.session_id
          : params.session_id[0]
      );

      if (
        checkoutSession.payment_status === "paid" &&
        checkoutSession.mode === "subscription" &&
        checkoutSession.metadata?.organizationId &&
        checkoutSession.metadata?.plan
      ) {
        const { organizationId, plan } = checkoutSession.metadata;
        const customerId = (checkoutSession.customer as string) || null;
        const subscriptionId =
          (checkoutSession.subscription as string) || null;

        await db
          .insert(organizationBilling)
          .values({
            id: crypto.randomUUID(),
            organizationId,
            plan: plan as PlanName,
            status: "active",
            provider: "stripe",
            customerId,
            subscriptionId: subscriptionId || undefined,
            currentPeriodEnd: null,
          })
          .onConflictDoUpdate({
            target: organizationBilling.organizationId,
            set: {
              plan: plan as PlanName,
              status: "active",
              provider: "stripe",
              customerId,
              subscriptionId: subscriptionId || undefined,
              updatedAt: new Date(),
            },
          });

        redirect("/dashboard/billing");
      }
    } catch (err) {
      console.error("Stripe checkout verification failed:", err);
    }
  }

  // --- Get organization & billing ---
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    redirect("/onboarding");
  }

  const organization = organizations[0];
  const billing = await getOrCreateBillingForOrganization(organization.id);

  const currentPlan = billing.plan as PlanName;

  // --- Helper to check Stripe readiness ---
  const stripeSecretReady = Boolean(process.env.STRIPE_SECRET_KEY);
  const isStripeReady = (planKey: string) => {
    if (!stripeSecretReady) return false;
    if (planKey === "pro") return Boolean(process.env.STRIPE_PRO_PRICE_ID);
    if (planKey === "business") return Boolean(process.env.STRIPE_BUSINESS_PRICE_ID);
    return false;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === Infinity) return "Unlimited";
    const gb = bytes / 1024 / 1024 / 1024;
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  };

  return (
    <div className="dashboard-shell top-nav-layout">
      <nav className="dashboard-sidebar dashboard-top-nav">
        <div className="brand">PortalKit</div>
        <div className="nav-links">
          <a href="/dashboard">
            <span>📊</span> Dashboard
          </a>
          <a href="/dashboard/billing" className="active">
            <span>💳</span> Billing
          </a>
        </div>
      </nav>

      <main className="dashboard-main with-top-nav">
        <header className="dashboard-topbar">
          <div>
            <h1>Billing & Subscription</h1>
            <p className="text-muted">Manage your organization's plan</p>
          </div>
        </header>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Current Plan</h2>
          </div>
          <div className="analytics-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="analytics-card" style={{ borderLeft: "4px solid var(--pk-primary)" }}>
              <h3>Plan</h3>
              <p style={{ fontSize: "22px" }}>{PLANS[currentPlan].name}</p>
              <p style={{ fontSize: "14px", color: "var(--pk-text-muted)", margin: 0 }}>
                Organization: {organization.name}
              </p>
              <p style={{ fontSize: "14px", color: "var(--pk-text-muted)", margin: 0 }}>
                Status: <strong style={{ textTransform: "uppercase", fontSize: "12px" }}>{billing.status}</strong>
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Choose a Plan</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {Object.entries(PLANS).map(([planKey, plan]) => {
              const isCurrent = planKey === currentPlan;
              const stripeReady = isStripeReady(planKey);
              const canSwitch = planKey !== "free" && planKey !== currentPlan && stripeReady;

              return (
                <div
                  key={planKey}
                  className={`plan-card ${isCurrent ? "plan-current" : ""}`}
                  style={{ border: isCurrent ? "2px solid var(--pk-primary)" : "1px solid var(--pk-border)" }}
                >
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    {isCurrent && <span className="plan-badge">Current</span>}
                  </div>
                  <div className="plan-features">
                    <div className="feature-row">
                      <span>Projects</span>
                      <span>{plan.maxProjects === Infinity ? "Unlimited" : plan.maxProjects}</span>
                    </div>
                    <div className="feature-row">
                      <span>Members</span>
                      <span>{plan.maxMembers === Infinity ? "Unlimited" : plan.maxMembers}</span>
                    </div>
                    <div className="feature-row">
                      <span>Storage</span>
                      <span>{formatBytes(plan.maxStorageBytes)}</span>
                    </div>
                  </div>
                  <div className="plan-actions">
                    {isCurrent ? (
                      <button className="btn-secondary" disabled>Current Plan</button>
                    ) : planKey === "free" ? (
                      <button className="btn-secondary" disabled>Downgrade unavailable</button>
                    ) : !stripeReady ? (
                      <button className="btn-secondary" disabled>Stripe not configured</button>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          const checkout = await upgradePlanAction(planKey as PlanName);
                          redirect(checkout.url);
                        }}
                      >
                        <button type="submit" className="btn-primary">
                          Switch to {plan.name}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!stripeSecretReady && (
            <div className="alert alert-error" style={{ marginTop: "16px" }}>
              ⚠️ Stripe is not configured. Add <code>STRIPE_SECRET_KEY</code> to your environment variables to enable paid upgrades.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
