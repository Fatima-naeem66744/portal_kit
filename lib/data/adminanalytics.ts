import { db } from "@/database";
import { count, countDistinct, eq, sum } from "drizzle-orm";

import { project, task, attachment } from "@/database/schema";
import { member } from "@/auth-schema";

export async function getOrganizationAnalytics(
  organizationId: string
) {
  const [totalProjects, totalTasks, totalAttachments, totalMembers] = await Promise.all([
    db.select({ count: count() })
      .from(project)
      .where(eq(project.organizationId, organizationId)),

    db.select({ count: count() })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .where(eq(project.organizationId, organizationId)),  

    db.select({ count: sum(attachment.size) })
      .from(attachment)
      .where(eq(attachment.organizationId, organizationId)),

    db.select({ count: countDistinct(member.userId) })
      .from(member)
      .where(eq(member.organizationId, organizationId)),
  ]);

  return {
    totalProjects: totalProjects[0].count,
    totalTasks: totalTasks[0].count,
    storageUsedBytes: Number(totalAttachments[0].count ?? 0),
    totalMembers: totalMembers[0].count,
  };

}