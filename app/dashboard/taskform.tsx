"use client";

import { createTaskAction } from "./action";

export default function TaskForm({
  projectId,
}: {
  projectId: string;
}) {
  return (
    <form
      className="task-form"
      action={async (formData) => {
        await createTaskAction(projectId, formData);
        window.location.reload();
      }}
    >
      <input
        name="title"
        placeholder="Task title"
        required
      />

      <textarea
        name="description"
        placeholder="Task description"
      />

      <button type="submit">
        Add Task
      </button>
    </form>
  );
}