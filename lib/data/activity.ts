import { desc, eq } from "drizzle-orm";
import { db } from "@/database";
import { activity } from "@/database/schema";
import { user } from "@/auth-schema";


export async function createActivity({
  id,
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  message,
  metadata = {},
}: {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  metadata?: Record<string, unknown>;

}) {
    try {
  const [newActivity] = await db
    .insert(activity)
    .values({
      id,
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      message,
      metadata,
    })
    .returning();

  return newActivity;
}
    catch (error) {
    console.error("ACTIVITY DATABASE ERROR:", error);
    throw error;
  }
}
// fetch activities for a given organization

export async function getActivitiesForOrganization(
  organizationId: string
) {

  const activities = await db
    .select({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      message: activity.message,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      userId: activity.userId,
      userName: user.name,
    })
    .from(activity)
    .leftJoin(user, eq(activity.userId, user.id))
    .where(eq(activity.organizationId, organizationId))
    .orderBy(desc(activity.createdAt));

  return activities;
}