import { eq } from "drizzle-orm";

import { db } from "@/database";
import { organizationBilling } from "@/database/schema";

export async function getBillingForOrganization(
  organizationId: string
) {
  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  return billing;
}
export async function getOrCreateBillingForOrganization(
  organizationId: string
) {
  const existingBilling =
    await getBillingForOrganization(organizationId);

  if (existingBilling) {
    return existingBilling;
  }
// automatically create a new billing record for the organization if it doesn't exist
// this is free plan created automatically if someone has no billing 
  const [newBilling] = await db
    .insert(organizationBilling)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      plan: "free",
      status: "active",
    })
    .returning();

  return newBilling;
}