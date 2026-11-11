"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createProject } from "@/lib/data/project";
import { deleteProject } from "@/lib/data/project";
import { updateProject } from "@/lib/data/project";
import { createTask } from "@/lib/data/tasks";
import { getProjectsForOrganization } from "@/lib/data/project";
import { updateTaskStatus } from "@/lib/data/tasks";
import {
  createComment,
  getTaskForOrganization,
} from "@/lib/data/comments";
import { revalidatePath, updateTag } from "next/cache";
import { createActivity } from "@/lib/data/activity";
import { createUploadUrl } from "@/lib/storage";
import { createAttachment } from "@/lib/data/attachment";
import { canAddMember } from "@/lib/data/members";
import { checkstoragelimit } from "@/lib/storage";
import { PLANS , PlanName } from "@/lib/plan";
import { createCheckoutSession } from "@/lib/stripebilling/checkout";
import { getBillingForOrganization } from "@/lib/billing";


export async function createProjectAction(
  prevState: {
    success: boolean;
    error: string;
  },
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  // 1. Get the currently logged-in user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. Get the user's organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }

  //  use the user's first organization.
  const organization = organizations[0];

  // 3. Get project data from the form
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!name) {
    throw new Error("Project name is required.");
  }

  // 4. Create the project
  try {
  const newProject = await createProject({
    id: crypto.randomUUID(),
    organizationId: organization.id,
    name,
    description,
    createdBy: session.user.id,
  });

  await createActivity({
    id: crypto.randomUUID(),
    organizationId: organization.id,
    userId: session.user.id,
    action: "project_created",
    entityType: "project",
    entityId: newProject.id,
    message: `Created project "${newProject.name}"`,
  });

  updateTag(`projects:${organization.id}`);

  console.log("Created project:", newProject);

  return {
    success: true,
    error: "",
  };
} catch (error) {
  return {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : "Failed to create project.",
  };
}
}
export async function deleteProjectAction(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }

  const deletedProject = await deleteProject({
    projectId,
    organizationIds: organizations.map((org) => org.id),
  });

  if (!deletedProject) {
    return {
      ok: false as const,
      error: "Project not found, or you don't have access to it.",
    };
  }

  // create an activity log for the deletion and add in the audit log 
  await createActivity({
    id: crypto.randomUUID(),
    organizationId: deletedProject.organizationId,
    userId: session.user.id,
    action: "project_deleted",
    entityType: "project",
    entityId: deletedProject.id,
    message: `Deleted project "${deletedProject.name}"`,
    metadata: {
      deletedProjectName: deletedProject.name,
      deletedProjectDescription: deletedProject.description,
    },
  });

  updateTag(`projects:${deletedProject.organizationId}`);

  return { ok: true as const, project: deletedProject };
}
export async function updateProjectAction(
  projectId: string,
  formData: FormData
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData
    .get("description")
    ?.toString()
    .trim();

  if (!name) {
    throw new Error("Project name is required.");
  }

  // find the existing project 
   const projects = await Promise.all(
    organizations.map((org) =>
      getProjectsForOrganization(org.id)
    )
  );
  const existingProject = projects.flat()
    .find((project) => project.id === projectId);

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  const updatedProject = await updateProject({
    projectId,
    organizationIds: organizations.map((org) => org.id),
    name,
    description,
  });

  if (!updatedProject) {
    throw new Error("Project not found.");
  }
// check whether anything changed before creating an activity log
  const nameChanged = existingProject.name !== updatedProject.name;
  const descriptionChanged =
    existingProject.description !== updatedProject.description;

    if (nameChanged || descriptionChanged) {
      await createActivity({
      id: crypto.randomUUID(),
      organizationId: updatedProject.organizationId,
      userId: session.user.id,
      action: "project_updated",
      entityType: "project",
      entityId: updatedProject.id,
      message: `Updated project "${updatedProject.name}"`,
      metadata: {
        previousName: existingProject.name,
        newName: updatedProject.name,
        previousDescription: existingProject.description,
        newDescription: updatedProject.description,
      },
    });
  }
  updateTag(`projects:${updatedProject.organizationId}`);

  return updatedProject;
}
export async function createTaskAction(
  projectId: string,
  formData: FormData
) {
  // 1. Who is making this request?
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. What organization does this user belong to?
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }

  const organization = organizations[0];

  // 3. Does this project belong to that organization?
  const projects = await getProjectsForOrganization(organization.id);
  const existingProject = projects.find((project) => project.id === projectId);

  if (!existingProject) {
    throw new Error("Project not found.");
  }

  // 4. Read task information from the form
  const title = formData.get("title")?.toString().trim();

  const description = formData
    .get("description")
    ?.toString()
    .trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  // 5. Now it's safe to create the task
  const newTask = await createTask({
    id: crypto.randomUUID(),
    projectId: existingProject.id,
    title,
    description,
    createdBy: session.user.id,
  });

  console.log("Created task:", newTask);
// add in audit log 
   await createActivity({
    id: crypto.randomUUID(),
    organizationId: organization.id,
    userId: session.user.id,
    action: "task_created",
    entityType: "task",
    entityId: newTask.id,
    message: `Created task "${newTask.title}" in project "${existingProject.name}"`,
    metadata: {
      taskTitle: newTask.title,
      projectId: existingProject.id,
      projectName: existingProject.name,
    },
  });

  return newTask;
}
// update task status action
export async function updateTaskStatusAction(
  taskId: string,
  status: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }
    const organization = organizations[0];


  const existingTask = await getTaskForOrganization({
    taskId,
    organizationId: organization.id,
  });

  if (!existingTask) {
    throw new Error("Task not found or access denied.");
  }

  // 4. Save the previous status
  const previousStatus = existingTask.status;

  const updatedTask = await updateTaskStatus({
    taskId,
    status,
  });
  if (previousStatus !== updatedTask.status) {
    await createActivity({
      id: crypto.randomUUID(),
      organizationId: organization.id,
      userId: session.user.id,
      action: "task_status_updated",
      entityType: "task",
      entityId: updatedTask.id,
      message: `Changed task status from ${previousStatus} to ${updatedTask.status}`,
      metadata: {
        previousStatus,
        newStatus: updatedTask.status,
      },
    });
  }

  // Refresh the dashboard so the optimistic status matches the real data.
  revalidatePath("/dashboard");

  return updatedTask;
}
export async function createCommentAction(
  taskId: string,
  formData: FormData
) {
  // 1. Check login
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. Get user's organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error(
      "You don't belong to an organization."
    );
  }

  // 3. For now, use the first organization
  const organization = organizations[0];

  // 4. Check that the task belongs to this organization
  const existingTask = await getTaskForOrganization({
    taskId,
    organizationId: organization.id,
  });

  if (!existingTask) {
    throw new Error("Task not found.");
  }

  // 5. Get comment text
  const content = formData
    .get("content")
    ?.toString()
    .trim();

  if (!content) {
    throw new Error("Comment cannot be empty.");
  }

  // 6. Create the comment
  const newComment = await createComment({
    id: crypto.randomUUID(),
    taskId: existingTask.id,
    content,
    createdBy: session.user.id,
  });

   await createActivity({
    id: crypto.randomUUID(),
    organizationId: organization.id,
    userId: session.user.id,
    action: "comment_created",
    entityType: "comment",
    entityId: newComment.id,
    message: `Added a comment to task "${existingTask.title}"`,
    metadata: {
      taskId: existingTask.id,
      taskTitle: existingTask.title,
      commentId: newComment.id,
      commentContent: newComment.content,
    },
  });

  // Refresh the dashboard so the new comment shows up right away.
  revalidatePath("/dashboard");
}

export async function createFileUploadUrlAction({
  taskId,
  fileName,
  contentType,
  filesize,
}: {
  taskId?: string;
  fileName: string;
  contentType: string;
  filesize : number;
}) {
  // 1. Check that the user is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. Get the user's organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    throw new Error("You don't belong to an organization.");
  }
  const organization = organizations[0]
// check the storage limit before making the signed url
   await checkstoragelimit({
    organizationId: organization.id,
    filesize,
  });

  // 5. Create a unique storage key
  const key = `uploads/${session.user.id}/${crypto.randomUUID()}-${fileName}`;

  // 6. Generate temporary upload URL
  const url = await createUploadUrl({
    key,
    contentType,
  });

  // 7. Return the temporary URL
  return {
    url,
    key,
  };
}

export async function createAttachmentAction({
  taskId,
  fileName,
  fileKey,
  contentType,
  size,
}: {
  taskId?: string | null;
  fileName: string;
  fileKey: string;
  contentType: string;
  size: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  const organizations = await auth.api.listOrganizations({
  headers: await headers(),
});

if (!organizations || organizations.length === 0) {
  throw new Error("You don't belong to an organization.");
}

const organization = organizations[0];

  const newAttachment = await createAttachment({
    id: crypto.randomUUID(),
    organizationId: organization.id,
    taskId: taskId ?? null,
    fileName,
    fileKey,
    contentType,
    size,
    uploadedBy: session.user.id,
  });

  return newAttachment;
}

export async function checkMemberLimitAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. Get user's organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    return {
      allowed: false,
      error: "You don't belong to an organization.",
    };
  }

  const organization = organizations[0] 
  return canAddMember(organization.id);
}

export async function upgradePlanAction(plans : PlanName) {

  if (plans !== "pro" && plans !== "business") {
    throw new Error("Invalid paid plan.");
  }
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in.");
  }

  // 2. Get user's organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (!organizations || organizations.length === 0) {
    return {
      allowed: false,
      error: "You don't belong to an organization.",
    };
  }
// checkout 
  const organization = organizations[0];
  //Check the user's role in this organization.
  // membership contains all the members of the agency 
  const membership = await auth.api.listMembers({
    query: {
      organizationId: organization.id,
      limit: 100,
    },
    headers: await headers(),
  });
// now find the current user in the membership list to check their role
  const currentMember = membership.members.find(
    (member) => member.userId === session.user.id
  );

  if (
    !currentMember ||
    !["owner", "admin"].includes(currentMember.role)
  ) {
    throw new Error("Only organization owners and admins can manage billing.");
  }

  // 5. Read the current billing information.
  const billing = await getBillingForOrganization(organization.id);

  // 6. Don't create another Checkout Session for the current plan.
  if (billing?.plan === plans && billing?.status === "active") {
    throw new Error("Your organization is already on this plan.");
  }

  // 7. Ask Stripe to create a Checkout Session.
  const checkout = await createCheckoutSession({
    organizationId: organization.id,
    plan: plans,
    customerId: billing?.customerId,
  });

  // 8. Return the URL to the caller.
  return {
    success: true,
    url: checkout.url,
  };
}