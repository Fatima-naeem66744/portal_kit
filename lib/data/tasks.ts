import { eq } from "drizzle-orm";

import { db } from "@/database";
import { task } from "@/database/schema";
export async function getTasksForProject(
  projectId: string
) {
  return db
    .select()
    .from(task)
    .where(eq(task.projectId, projectId));
}
export async function createTask({
  id,
  projectId,
  title,
  description,
  createdBy,
}: {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  createdBy: string;
}) {
  const [newTask] = await db
    .insert(task)
    .values({
      id,
      projectId,
      title,
      description,
      createdBy,
    })
    .returning();

  return newTask;
}
export async function updateTaskStatus({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const [updatedTask] = await db
    .update(task)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(task.id, taskId))
    .returning();

  return updatedTask;
}