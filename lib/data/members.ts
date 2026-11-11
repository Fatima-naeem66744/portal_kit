import { countDistinct, eq, and } from "drizzle-orm";
import { db } from "@/database";
import { member, invitation } from "@/auth-schema";
import { getOrCreateBillingForOrganization } from "@/lib/billing";
import { PLANS, type PlanName } from "@/lib/plan";

export async function canAddMember(organizationId: string) {
  const billing = await getOrCreateBillingForOrganization(organizationId);
  const plan = PLANS[billing.plan as PlanName];
  const [{ count: memberCount }] = await db
    .select({ count: countDistinct(member.userId) })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  const pendingInvitations = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending")
      )
    );

  const totalCount = Number(memberCount) + pendingInvitations.length;

  if (totalCount >= plan.maxMembers) {
    return {
      allowed: false,
      error: `Your ${plan.name} plan allows only ${plan.maxMembers} members. Please upgrade to invite more.`,
    };
  }

  return {
    allowed: true,
    error: "",
  };

}