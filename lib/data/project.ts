import { eq, and, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db } from "@/database";
import { project } from "@/database/schema";
import { getOrCreateBillingForOrganization } from "@/lib/billing";
import { PLANS, type PlanName } from "@/lib/plan";

export async function getProjectsForOrganization(
  organizationId: string
) {
    "use cache";
      cacheTag(`projects:${organizationId}`);


  return db
    .select()
    .from(project)
    .where(eq(project.organizationId, organizationId));
}
export async function createProject({
  id,
  organizationId,
  name,
  description,
  createdBy,
}: {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy: string;
}) {
  const billing =
    await getOrCreateBillingForOrganization(organizationId);

  // 2. Get the organization's plan
  const plan = PLANS[billing.plan as PlanName];

  // 3. Count the organization's existing projects
  const existingProjects = await db
    .select()
    .from(project)
    .where(eq(project.organizationId, organizationId));

  // 4. Check the project limit
  if (existingProjects.length >= plan.maxProjects) {
    throw new Error(
      `Your ${plan.name} plan allows a maximum of ${plan.maxProjects} projects.`
    );
  }

  const [newProject] = await db
    .insert(project)
    .values({
      id,
      organizationId,
      name,
      description,
      createdBy,
    })
    .returning();

  return newProject;
}
export async function deleteProject({
  projectId,
  organizationIds,
}: {
  projectId: string;
  organizationIds: string[];
}) {
  if (organizationIds.length === 0) return undefined;

  const [deletedProject] = await db
    .delete(project)
    .where(
      and(
        eq(project.id, projectId),
        inArray(project.organizationId, organizationIds)
      )
    )
    .returning();

  return deletedProject;
}
export async function updateProject({
  projectId,
  organizationIds,
  name,
  description,
}: {
  projectId: string;
  organizationIds: string[];
  name: string;
  description?: string;
}) {
  if (organizationIds.length === 0) return undefined;

  const [updatedProject] = await db
    .update(project)
    .set({
      name,
      description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(project.id, projectId),
        inArray(project.organizationId, organizationIds)
      )
    )
    .returning();

  return updatedProject;
}