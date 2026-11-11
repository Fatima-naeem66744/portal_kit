import { eq , and  } from "drizzle-orm";
import { db } from "@/database";
import { comment, project, task } from "@/database/schema";
export async function getCommentsForTask(
  taskId: string) {
    return db.select()
      .from(comment)
      .where(eq(comment.taskId, taskId));
  }
export async function createComment({
  id,
  taskId,
  content,
  createdBy,
}: {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
}) {
  const [newComment] = await db
    .insert(comment)
    .values({
      id,
      taskId,
      content,
      createdBy,
    })
    .returning();

  return newComment;
}

export async function getTaskForOrganization({
  taskId,
  organizationId,
}: {
  taskId: string;
  organizationId: string;
}) {
  const [foundTask] = await db
    .select({
      task,
    })
    .from(task)
    .innerJoin(
      project,
      eq(task.projectId, project.id)
    )
    .where(
      and(
        eq(task.id, taskId),
        eq(project.organizationId, organizationId)
      )
    )
    .limit(1);

  return foundTask?.task;
}