import { headers } from "next/headers";
import { redirect } from "next/navigation";

import InviteForm from "./accept-invitation/inviteform";
import DeleteProjectButton from "./deletebutton";
import EditProjectForm from "./editproject";
import TaskForm from "./taskform";
import TaskItem from "./tasklist";
import CommentForm from "./commentform";
import FileUpload from "./file";
import ProjectForm from "./projectform";

import { auth } from "@/lib/auth";
import { getProjectsForOrganization } from "@/lib/data/project";
import { getTasksForProject } from "@/lib/data/tasks";
import { getAttachments } from "@/lib/data/attachment";
import { getCommentsForTask } from "@/lib/data/comments";
import { getActivitiesForOrganization } from "@/lib/data/activity";
import { getOrganizationAnalytics } from "@/lib/data/adminanalytics";

export default async function DashboardContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const organizations = await auth.api.listOrganizations({ headers: await headers() });
  if (!organizations || organizations.length === 0) {
    redirect("/onboarding");
  }

  const organization = organizations[0];
  const analytics = await getOrganizationAnalytics(organization.id);
  const projects = await getProjectsForOrganization(organization.id);
  const projectsWithTasks = await Promise.all(
    projects.map(async (project) => ({
      ...project,
      tasks: await getTasksForProject(project.id),
    }))
  );
  const activities = await getActivitiesForOrganization(organization.id);
  const attachments = await getAttachments(organization.id);

  return (
    <div className="dashboard-shell top-nav-layout">
      <nav className="dashboard-sidebar dashboard-top-nav">
        <div className="brand">PortalKit</div>
        <div className="nav-links">
          <a href="/" className="active">
            <span>📊</span> Dashboard
          </a>
          <a href="/dashboard/billing">
            <span>💳</span> Billing
          </a>
        </div>
      </nav>

      <main className="dashboard-main with-top-nav">
        <div className="mb-24">
          <InviteForm organizationId={organization.id} />
        </div>
        <header className="dashboard-topbar">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted">Organization: {organization.name}</p>
          </div>
          <div className="dashboard-user-info">
            <span>👤 {session.user.name}</span>
            <span>·</span>
            <span>{session.user.email}</span>
          </div>
        </header>

        <ProjectForm />

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Organization Analytics</h2>
          </div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Total Projects</h3>
              <p>{analytics.totalProjects}</p>
              <span className="stat-icon">📁</span>
            </div>
            <div className="analytics-card">
              <h3>Total Members</h3>
              <p>{analytics.totalMembers}</p>
              <span className="stat-icon">👥</span>
            </div>
            <div className="analytics-card">
              <h3>Total Tasks</h3>
              <p>{analytics.totalTasks}</p>
              <span className="stat-icon">✅</span>
            </div>
            <div className="analytics-card">
              <h3>Storage Used</h3>
              <p>
                {(analytics.storageUsedBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
              <span className="stat-icon">💾</span>
            </div>
          </div>
        </section>

        <FileUpload />

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Attachments</h2>
          </div>
          {attachments.length === 0 ? (
            <div className="empty-state">
              <h3>No attachments yet</h3>
              <p>Upload files to tasks to see them here.</p>
            </div>
          ) : (
            <ul className="attachment-list">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="attachment-card">
                  <div>
                    <strong>{attachment.fileName}</strong>
                    <p className="attachment-meta">
                      {attachment.contentType} · {attachment.size} bytes
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Projects</h2>
          </div>
          {projectsWithTasks.length === 0 ? (
            <div className="empty-state">
              <h3>No projects yet</h3>
              <p>Create your first project to get started.</p>
            </div>
          ) : (
            <ul className="project-list">
              {projectsWithTasks.map((project) => (
                <li key={project.id} className="project-card">
                  <div className="project-header">
                    <div className="project-info">
                      <h3>{project.name}</h3>
                      {project.description && (
                        <p className="project-description">{project.description}</p>
                      )}
                      <div className="project-meta">
                        <span>{project.tasks.length} tasks</span>
                      </div>
                    </div>
                    <div className="project-actions">
                      <EditProjectForm project={project} />
                      <DeleteProjectButton projectId={project.id} />
                    </div>
                  </div>

                  <div className="tasks-section">
                    <h4>Tasks</h4>
                    {project.tasks.length === 0 ? (
                      <p>No tasks yet.</p>
                    ) : (
                      <ul className="task-list">
                        {project.tasks.map(async (task) => {
                          const comments = await getCommentsForTask(task.id);
                          return (
                            <li key={task.id} className="task-card">
                              <TaskItem task={task} />
                              <div className="comments-section">
                                <h5>Comments</h5>
                                {comments.length === 0 ? (
                                  <p>No comments yet.</p>
                                ) : (
                                  <ul className="comment-list">
                                    {comments.map((comment) => (
                                      <li key={comment.id} className="comment-card">
                                        <p>{comment.content}</p>
                                        <small>By {comment.createdBy}</small>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <CommentForm taskId={task.id} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <TaskForm projectId={project.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Activity &amp; Audit Log</h2>
          </div>
          {activities.length === 0 ? (
            <div className="empty-state">
              <h3>No activity yet</h3>
              <p>Your organization activity will appear here.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div key={activity.id} className="activity-card">
                  <h3>{activity.message}</h3>
                  <p>
                    <strong>Performed by:</strong> {activity.userName ?? "Unknown user"}
                  </p>
                  <small>{activity.createdAt.toLocaleString()}</small>
                  {activity.action === "project_updated" && (
                    <div className="audit-details">
                      <p><strong>Previous name:</strong> {String(activity.metadata?.previousName ?? "—")}</p>
                      <p><strong>New name:</strong> {String(activity.metadata?.newName ?? "—")}</p>
                      <p><strong>Previous description:</strong> {String(activity.metadata?.previousDescription ?? "—")}</p>
                      <p><strong>New description:</strong> {String(activity.metadata?.newDescription ?? "—")}</p>
                    </div>
                  )}
                  {activity.action === "task_status_updated" && (
                    <div className="audit-details">
                      <p>Previous status: {String(activity.metadata?.previousStatus ?? "—")}</p>
                      <p>New status: {String(activity.metadata?.newStatus ?? "—")}</p>
                    </div>
                  )}
                  {activity.action === "project_deleted" && (
                    <div className="audit-details">
                      <p>Deleted project: {String(activity.metadata?.deletedProjectName ?? "—")}</p>
                    </div>
                  )}
                  {activity.action === "comment_created" && (
                    <div className="audit-details">
                      <p><strong>Task:</strong> {String(activity.metadata?.taskTitle ?? "—")}</p>
                      <p><strong>Comment:</strong> {String(activity.metadata?.commentContent ?? "—")}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
