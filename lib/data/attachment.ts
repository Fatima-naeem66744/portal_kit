import { db } from "@/database";
import { attachment } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function createAttachment({
  id,
  organizationId,
  taskId,
  fileName,
  fileKey,
  contentType,
  size,
  uploadedBy,
}: {
  id: string;
  organizationId : string;
  taskId?: string | null;
  fileName: string;
  fileKey: string;
  contentType: string;
  size: number;
  uploadedBy: string;
}) {
  try {
  const [newAttachment] = await db.insert(attachment).values({
    id,
    organizationId,
    taskId,
    fileName,
    fileKey,
    contentType,
    size,
    uploadedBy,
  }).returning();
  return newAttachment;
} catch (e: unknown) {
  const error = e as {
    message?: unknown;
    cause?: { message?: unknown; detail?: unknown; code?: unknown };
  };
  console.error("DB error:", error.cause?.message ?? error.message, error.cause?.detail, error.cause?.code);
  throw e;
}}
// fetch attachments 
export async function getAttachments(organizationId: string) {
  return db
    .select()
    .from(attachment)
    .where(eq(attachment.organizationId, organizationId));
}
